import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDueWebhookDeliveries } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

function serializeDelivery(delivery: {
  id: string;
  webhookId: string;
  eventId: string;
  eventType: string;
  status: string;
  attempt: number;
  responseStatus: number | null;
  responseBody: string | null;
  payload: unknown;
  requestHeaders: unknown;
  deliveredAt: Date | null;
  createdAt: Date;
  webhook: {
    id: string;
    name: string;
    url: string;
  };
}) {
  return {
    id: delivery.id,
    webhookId: delivery.webhookId,
    webhookName: delivery.webhook.name,
    webhookUrl: delivery.webhook.url,
    eventId: delivery.eventId,
    eventType: delivery.eventType,
    status: delivery.status,
    attempt: delivery.attempt,
    responseStatus: delivery.responseStatus,
    responseBody: delivery.responseBody,
    payload: delivery.payload,
    requestHeaders: delivery.requestHeaders,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    createdAt: delivery.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  void processDueWebhookDeliveries().catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] due delivery processing failed", error);
    }
  });

  const status = new URL(request.url).searchParams.get("status")?.toLowerCase();
  const deliveries = await prisma.webhookDelivery.findMany({
    where: {
      webhook: { userId: auth.user.id },
      ...(status && status !== "all" ? { status } : {}),
    },
    include: {
      webhook: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    deliveries: deliveries.map(serializeDelivery),
  });
}
