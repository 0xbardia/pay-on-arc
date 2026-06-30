import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUser } from "@/lib/auth";
import { retryWebhookDelivery } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const delivery = await retryWebhookDelivery(id, auth.user.id);

  if (!delivery) {
    return NextResponse.json({ error: "Failed delivery not found." }, { status: 404 });
  }

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "webhook_retry_requested",
    entityType: "WebhookDelivery",
    entityId: delivery.id,
    metadata: {
      webhookId: delivery.webhook.id,
      eventId: delivery.eventId,
      eventType: delivery.eventType,
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
      webhookName: delivery.webhook.name,
      webhookUrl: delivery.webhook.url,
    },
  });
}
