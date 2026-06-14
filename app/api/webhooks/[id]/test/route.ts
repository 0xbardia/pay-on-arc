import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { emitWebhookEventToEndpoint } from "@/lib/webhooks/deliver";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const limited = enforceRateLimit(_request, "webhooks:test", 30, 60_000);

  if (limited) {
    return limited;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const delivery = await emitWebhookEventToEndpoint({
    webhookId: id,
    userId: auth.user.id,
    type: "webhook.test",
    data: {
      message: "Pay On Arc webhook test",
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Webhook not found or disabled." }, { status: 404 });
  }

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "webhook_test_sent",
    entityType: "WebhookEndpoint",
    entityId: id,
    metadata: {
      deliveryId: delivery.id,
      eventId: delivery.eventId,
      status: delivery.status,
    },
  });

  return NextResponse.json({
    delivery: {
      id: delivery.id,
      eventId: delivery.eventId,
      eventType: delivery.eventType,
      status: delivery.status,
      attempt: delivery.attempt,
      responseStatus: delivery.responseStatus,
      responseBody: delivery.responseBody,
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      createdAt: delivery.createdAt.toISOString(),
    },
  });
}
