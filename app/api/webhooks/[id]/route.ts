import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";
import { generateWebhookSecret, maskWebhookSecret } from "@/lib/webhooks/signature";
import { validateWebhookName, validateWebhookUrl } from "@/lib/webhooks/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateWebhookBody = {
  name?: string;
  url?: string;
  enabled?: boolean;
  regenerateSecret?: boolean;
};

function serializeWebhook(webhook: {
  id: string;
  name: string;
  url: string;
  secretPrefix: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}) {
  return {
    id: webhook.id,
    name: webhook.name,
    url: webhook.url,
    secret: maskWebhookSecret(webhook.secretPrefix),
    enabled: webhook.enabled,
    status: webhook.enabled ? "enabled" : "disabled",
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
    lastSuccessAt: webhook.lastSuccessAt?.toISOString() ?? null,
    lastFailureAt: webhook.lastFailureAt?.toISOString() ?? null,
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const limited = enforceRateLimit(request, "webhooks:update", 30, 60_000);

  if (limited) {
    return limited;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as UpdateWebhookBody | null;
  const existing = await prisma.webhookEndpoint.findFirst({
    where: { id, userId: auth.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
  }

  const data: {
    name?: string;
    url?: string;
    enabled?: boolean;
    secretHash?: string;
    secretPrefix?: string;
  } = {};

  if (body?.name !== undefined) {
    const name = validateWebhookName(body.name);

    if (!name.ok) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: name.message }, { status: 400 });
    }

    data.name = name.name;
  }

  if (body?.url !== undefined) {
    const url = validateWebhookUrl(body.url);

    if (!url.ok) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: url.message }, { status: 400 });
    }

    data.url = url.url;
  }

  if (body?.enabled !== undefined) {
    data.enabled = Boolean(body.enabled);
  }

  const regeneratedSecret = body?.regenerateSecret ? generateWebhookSecret() : null;

  if (regeneratedSecret) {
    data.secretHash = regeneratedSecret.secretHash;
    data.secretPrefix = regeneratedSecret.secretPrefix;
  }

  const webhook = await prisma.webhookEndpoint.update({
    where: { id },
    data,
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: regeneratedSecret ? "webhook_secret_regenerated" : "webhook_updated",
    entityType: "WebhookEndpoint",
    entityId: webhook.id,
    metadata: {
      name: webhook.name,
      enabled: webhook.enabled,
      urlChanged: body?.url !== undefined,
    },
  });

  void emitWebhookEvent({
    userId: auth.user.id,
    type: "merchant.updated",
    data: {
      resource: "webhook",
      action: regeneratedSecret ? "secret_regenerated" : "updated",
      webhookId: webhook.id,
      enabled: webhook.enabled,
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] emit merchant.updated failed", error);
    }
  });

  return NextResponse.json({
    webhook: serializeWebhook(webhook),
    secret: regeneratedSecret?.secret ?? null,
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const limited = enforceRateLimit(_request, "webhooks:delete", 20, 60_000);

  if (limited) {
    return limited;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.webhookEndpoint.findFirst({
    where: { id, userId: auth.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
  }

  await prisma.webhookEndpoint.delete({
    where: { id },
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "webhook_deleted",
    entityType: "WebhookEndpoint",
    entityId: existing.id,
    metadata: {
      name: existing.name,
      url: existing.url,
    },
  });

  return NextResponse.json({
    webhook: {
      id: existing.id,
      deleted: true,
    },
  });
}
