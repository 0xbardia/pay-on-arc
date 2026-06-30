import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { backgroundJobTypes, enqueueJob } from "@/lib/jobs/queue";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { signArcPayWebhook } from "@/lib/webhooks/signature";

export type ArcPayWebhookEventType =
  | "payment.created"
  | "payment.pending"
  | "payment.confirmed"
  | "payment.failed"
  | "link.created"
  | "link.disabled"
  | "link.expired"
  | "apikey.created"
  | "apikey.revoked"
  | "merchant.updated"
  | "webhook.test";

export type ArcPayWebhookPayload = {
  id: string;
  type: ArcPayWebhookEventType;
  createdAt: string;
  merchantId: string;
  data: Prisma.JsonValue;
};

const retryDelaysMs = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
const maxAttempts = 4;
const responsePreviewLength = 2000;
const deliveryRateWindowMs = 60_000;
const maxDeliveriesPerWindow = 30;
const deliveryRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkMerchantDeliveryRateLimit(userId: string, increment = 1) {
  const now = Date.now();
  const current = deliveryRateLimit.get(userId);

  if (!current || current.resetAt <= now) {
    deliveryRateLimit.set(userId, { count: increment, resetAt: now + deliveryRateWindowMs });
    return true;
  }

  if (current.count + increment > maxDeliveriesPerWindow) {
    return false;
  }

  current.count += increment;
  return true;
}

function buildHeaders({
  eventId,
  signature,
  timestamp,
}: {
  eventId: string;
  signature: string;
  timestamp: string;
}) {
  return {
    "Content-Type": "application/json",
    "X-ArcPay-Event": eventId,
    "X-ArcPay-Signature": signature,
    "X-ArcPay-Timestamp": timestamp,
  };
}

function redactStoredHeaders(headers: Record<string, string>) {
  const signature = headers["X-ArcPay-Signature"];

  return {
    ...headers,
    "X-ArcPay-Signature": signature ? `${signature.slice(0, 12)}...redacted` : "redacted",
  };
}

function safeBodyPreview(body: string) {
  return body.length > responsePreviewLength ? `${body.slice(0, responsePreviewLength)}...` : body;
}

export async function emitWebhookEvent({
  userId,
  type,
  data,
}: {
  userId: string;
  type: ArcPayWebhookEventType;
  data: Prisma.JsonValue;
}) {
  const webhooks = await prisma.webhookEndpoint.findMany({
    where: {
      userId,
      enabled: true,
    },
    select: { id: true },
  });

  if (webhooks.length === 0) {
    return;
  }

  if (!checkMerchantDeliveryRateLimit(userId, webhooks.length)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[webhooks] merchant delivery rate limited", { userId, type });
    }
    return;
  }

  const payload: ArcPayWebhookPayload = {
    id: `evt_${randomUUID().replace(/-/g, "")}`,
    type,
    createdAt: new Date().toISOString(),
    merchantId: userId,
    data,
  };

  const deliveries = await prisma.webhookDelivery.createManyAndReturn({
    data: webhooks.map((webhook) => ({
      webhookId: webhook.id,
      eventId: payload.id,
      eventType: payload.type,
      status: "pending",
      attempt: 0,
      payload,
    })),
    select: { id: true },
  });

  for (const delivery of deliveries) {
    await enqueueJob(backgroundJobTypes.webhookDelivery, { deliveryId: delivery.id });
  }
}

export async function emitWebhookEventToEndpoint({
  webhookId,
  userId,
  type,
  data,
}: {
  webhookId: string;
  userId: string;
  type: ArcPayWebhookEventType;
  data: Prisma.JsonValue;
}) {
  const webhook = await prisma.webhookEndpoint.findFirst({
    where: { id: webhookId, userId, enabled: true },
    select: { id: true },
  });

  if (!webhook) {
    return null;
  }

  if (!checkMerchantDeliveryRateLimit(userId)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[webhooks] merchant delivery rate limited", { userId, type });
    }
    return null;
  }

  const payload: ArcPayWebhookPayload = {
    id: `evt_${randomUUID().replace(/-/g, "")}`,
    type,
    createdAt: new Date().toISOString(),
    merchantId: userId,
    data,
  };

  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      eventId: payload.id,
      eventType: payload.type,
      status: "pending",
      attempt: 0,
      payload,
    },
  });

  await enqueueJob(backgroundJobTypes.webhookDelivery, { deliveryId: delivery.id });

  return prisma.webhookDelivery.findUnique({
    where: { id: delivery.id },
    include: { webhook: true },
  });
}

export async function processDueWebhookDeliveries() {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: "pending",
      nextAttemptAt: { lte: new Date() },
      attempt: { lt: maxAttempts },
    },
    select: { id: true },
    take: 25,
  });

  await Promise.all(
    deliveries.map((delivery) =>
      enqueueJob(backgroundJobTypes.webhookDelivery, { deliveryId: delivery.id }),
    ),
  );
}

export async function retryWebhookDelivery(deliveryId: string, userId: string) {
  const delivery = await prisma.webhookDelivery.findFirst({
    where: {
      id: deliveryId,
      status: "failed",
      webhook: { userId },
    },
    select: { id: true },
  });

  if (!delivery) {
    return null;
  }

  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "pending",
      nextAttemptAt: null,
      responseStatus: null,
      responseBody: null,
      deliveredAt: null,
    },
  });

  await enqueueJob(backgroundJobTypes.webhookDelivery, { deliveryId: delivery.id });

  return prisma.webhookDelivery.findUnique({
    where: { id: delivery.id },
    include: { webhook: true },
  });
}

export async function processWebhookDelivery(deliveryId: string) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  });

  if (!delivery || delivery.status === "success" || delivery.attempt >= maxAttempts || !delivery.webhook.enabled) {
    return;
  }

  const attempt = delivery.attempt + 1;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify(delivery.payload);
  const signature = signArcPayWebhook({
    secretHash: delivery.webhook.secretHash,
    timestamp,
    rawBody,
  });
  const headers = buildHeaders({
    eventId: delivery.eventId,
    signature,
    timestamp,
  });
  const storedHeaders = redactStoredHeaders(headers);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(delivery.webhook.url, {
      method: "POST",
      headers,
      body: rawBody,
      signal: controller.signal,
    });
    const responseBody = safeBodyPreview(await response.text().catch(() => ""));
    const success = response.status >= 200 && response.status < 300;

    clearTimeout(timeoutId);

    if (success) {
      await prisma.$transaction([
        prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "success",
            attempt,
            responseStatus: response.status,
            responseBody,
            requestHeaders: storedHeaders,
            deliveredAt: new Date(),
            nextAttemptAt: null,
          },
        }),
        prisma.webhookEndpoint.update({
          where: { id: delivery.webhookId },
          data: { lastSuccessAt: new Date() },
        }),
      ]);

      await writeAuditLog({
        action: "webhook_delivery_success",
        entityType: "WebhookDelivery",
        entityId: delivery.id,
        metadata: {
          webhookId: delivery.webhookId,
          eventId: delivery.eventId,
          eventType: delivery.eventType,
          responseStatus: response.status,
        },
      });
      return;
    }

    await markDeliveryFailure({
      deliveryId: delivery.id,
      webhookId: delivery.webhookId,
      attempt,
      responseStatus: response.status,
      responseBody,
      requestHeaders: storedHeaders,
      eventId: delivery.eventId,
      eventType: delivery.eventType,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    await markDeliveryFailure({
      deliveryId: delivery.id,
      webhookId: delivery.webhookId,
      attempt,
      responseStatus: null,
      responseBody: error instanceof Error ? error.message : "Webhook delivery failed.",
      requestHeaders: storedHeaders,
      eventId: delivery.eventId,
      eventType: delivery.eventType,
    });
  }
}

async function markDeliveryFailure({
  deliveryId,
  webhookId,
  attempt,
  responseStatus,
  responseBody,
  requestHeaders,
  eventId,
  eventType,
}: {
  deliveryId: string;
  webhookId: string;
  attempt: number;
  responseStatus: number | null;
  responseBody: string;
  requestHeaders: Record<string, string>;
  eventId: string;
  eventType: string;
}) {
  const exhausted = attempt >= maxAttempts;
  const nextDelay = retryDelaysMs[Math.min(attempt - 1, retryDelaysMs.length - 1)];
  const nextAttemptAt = exhausted ? null : new Date(Date.now() + nextDelay);

  await prisma.$transaction([
    prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: exhausted ? "failed" : "pending",
        attempt,
        responseStatus,
        responseBody: safeBodyPreview(responseBody),
        requestHeaders,
        deliveredAt: null,
        nextAttemptAt,
      },
    }),
    prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: { lastFailureAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    action: "webhook_delivery_failed",
    entityType: "WebhookDelivery",
    entityId: deliveryId,
    metadata: {
      webhookId,
      eventId,
      eventType,
      attempt,
      responseStatus,
      exhausted,
    },
  });

  if (!exhausted && nextAttemptAt) {
    await enqueueJob(
      backgroundJobTypes.webhookDelivery,
      { deliveryId },
      { runAt: nextAttemptAt, maxAttempts, dedupe: false },
    );
  }
}
