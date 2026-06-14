import { Webhook } from "lucide-react";
import { PageHeader } from "@/components/premium/page-header";
import { WebhooksManager, type WebhookDeliveryItem, type WebhookItem } from "@/components/webhooks-manager";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskWebhookSecret } from "@/lib/webhooks/signature";

export const dynamic = "force-dynamic";

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
}): WebhookItem {
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
}): WebhookDeliveryItem {
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

export default async function WebhooksPage() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return null;
  }

  const [webhooks, deliveries] = await Promise.all([
    prisma.webhookEndpoint.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.webhookDelivery.findMany({
      where: {
        webhook: { userId: auth.user.id },
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
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Developer"
        title="Webhooks"
        description="Send signed payment, link, API key, and merchant events to your backend without blocking checkout or confirmation flows."
        actions={
          <Button asChild variant="outline">
            <a href="#webhook-events">
              <Webhook className="h-4 w-4" aria-hidden="true" />
              Delivery logs
            </a>
          </Button>
        }
      />
      <div id="webhook-events">
        <WebhooksManager initialWebhooks={webhooks.map(serializeWebhook)} initialDeliveries={deliveries.map(serializeDelivery)} />
      </div>
    </div>
  );
}
