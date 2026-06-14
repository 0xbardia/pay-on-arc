import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";
import { generateWebhookSecret, maskWebhookSecret } from "@/lib/webhooks/signature";
import { validateWebhookName, validateWebhookUrl } from "@/lib/webhooks/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type CreateWebhookBody = {
  name?: string;
  url?: string;
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

export async function GET() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    webhooks: webhooks.map(serializeWebhook),
  });
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "webhooks:create", 20, 60_000);

  if (limited) {
    return limited;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateWebhookBody | null;
  const name = validateWebhookName(body?.name);
  const url = validateWebhookUrl(body?.url);

  if (!name.ok) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: name.message }, { status: 400 });
  }

  if (!url.ok) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: url.message }, { status: 400 });
  }

  const secret = generateWebhookSecret();
  const webhook = await prisma.webhookEndpoint.create({
    data: {
      userId: auth.user.id,
      name: name.name,
      url: url.url,
      secretHash: secret.secretHash,
      secretPrefix: secret.secretPrefix,
      enabled: true,
    },
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "webhook_created",
    entityType: "WebhookEndpoint",
    entityId: webhook.id,
    metadata: {
      name: webhook.name,
      url: webhook.url,
    },
  });

  void emitWebhookEvent({
    userId: auth.user.id,
    type: "merchant.updated",
    data: {
      resource: "webhook",
      action: "created",
      webhookId: webhook.id,
      name: webhook.name,
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] emit merchant.updated failed", error);
    }
  });

  return NextResponse.json(
    {
      webhook: serializeWebhook(webhook),
      secret: secret.secret,
    },
    { status: 201 },
  );
}
