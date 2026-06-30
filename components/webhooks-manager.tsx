"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Copy, Eye, KeyRound, Plus, RefreshCw, RotateCcw, Send, Trash2, X } from "lucide-react";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";

export type WebhookItem = {
  id: string;
  name: string;
  url: string;
  secret: string;
  enabled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};

export type WebhookDeliveryItem = {
  id: string;
  webhookId: string;
  webhookName: string;
  webhookUrl: string;
  eventId: string;
  eventType: string;
  status: string;
  attempt: number;
  responseStatus: number | null;
  responseBody: string | null;
  payload: unknown;
  requestHeaders: unknown;
  deliveredAt: string | null;
  createdAt: string;
};

type WebhooksManagerProps = {
  initialWebhooks: WebhookItem[];
  initialDeliveries: WebhookDeliveryItem[];
};

const deliveryFilters = ["all", "success", "failed", "pending"];

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function statusClass(status: string) {
  if (status === "success" || status === "enabled") {
    return "border-success/20 bg-success/10 text-success";
  }

  if (status === "failed" || status === "disabled") {
    return "border-danger/20 bg-danger/10 text-danger";
  }

  return "border-warning/20 bg-warning/10 text-warning";
}

function lastDelivery(webhook: WebhookItem) {
  if (webhook.lastSuccessAt && webhook.lastFailureAt) {
    return new Date(webhook.lastSuccessAt) > new Date(webhook.lastFailureAt)
      ? `Success ${formatDate(webhook.lastSuccessAt)}`
      : `Failure ${formatDate(webhook.lastFailureAt)}`;
  }

  if (webhook.lastSuccessAt) {
    return `Success ${formatDate(webhook.lastSuccessAt)}`;
  }

  if (webhook.lastFailureAt) {
    return `Failure ${formatDate(webhook.lastFailureAt)}`;
  }

  return "No deliveries yet";
}

export function WebhooksManager({ initialWebhooks, initialDeliveries }: WebhooksManagerProps) {
  const { notify } = useToast();
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDeliveryItem | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);

  const filteredDeliveries = useMemo(
    () => deliveries.filter((delivery) => deliveryFilter === "all" || delivery.status === deliveryFilter),
    [deliveries, deliveryFilter],
  );

  function resetCreate() {
    setCreateOpen(false);
    setName("");
    setUrl("");
    setError(null);
    setOneTimeSecret(null);
  }

  async function copyValue(value: string, title = "Copied to clipboard") {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        fallbackCopy(value);
      }
      notify({ type: "info", title });
    } catch (copyError) {
      console.error("[webhooks] copy failed", copyError);
      notify({ type: "error", title: "Copy failed", description: "Select the value manually and copy it." });
    }
  }

  async function refreshDeliveries(status = deliveryFilter) {
    const response = await fetch(`/api/webhooks/deliveries?status=${status}`);
    const payload = (await response.json().catch(() => null)) as { deliveries?: WebhookDeliveryItem[] } | null;

    if (response.ok && payload?.deliveries) {
      setDeliveries(payload.deliveries);
    }
  }

  async function createWebhook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      const payload = (await response.json().catch(() => null)) as {
        webhook?: WebhookItem;
        secret?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.webhook || !payload.secret) {
        setError(payload?.message ?? "Unable to create webhook.");
        notify({ type: "error", title: "Webhook creation failed", description: payload?.message ?? "Try again." });
        return;
      }

      setWebhooks((current) => [payload.webhook as WebhookItem, ...current]);
      setOneTimeSecret(payload.secret);
      notify({ type: "success", title: "Webhook created", description: "Copy the signing secret now." });
    } catch (createError) {
      console.error("[webhooks] create failed", createError);
      setError("Network failed. Try again.");
      notify({ type: "error", title: "Network failed", description: "Unable to create webhook." });
    } finally {
      setIsBusy(false);
    }
  }

  async function patchWebhook(webhook: WebhookItem, body: Record<string, unknown>) {
    setIsBusy(true);

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as {
        webhook?: WebhookItem;
        secret?: string | null;
        message?: string;
      } | null;

      if (!response.ok || !payload?.webhook) {
        notify({ type: "error", title: "Webhook update failed", description: payload?.message ?? "Try again." });
        return;
      }

      setWebhooks((current) => current.map((item) => (item.id === payload.webhook?.id ? payload.webhook : item)));

      if (payload.secret) {
        setCreateOpen(true);
        setName("");
        setUrl("");
        setOneTimeSecret(payload.secret);
      }

      notify({ type: "success", title: payload.secret ? "Webhook secret regenerated" : "Webhook updated" });
    } catch (patchError) {
      console.error("[webhooks] update failed", patchError);
      notify({ type: "error", title: "Network failed", description: "Unable to update webhook." });
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteWebhook(webhook: WebhookItem) {
    if (!window.confirm(`Delete webhook "${webhook.name}"? Delivery history for this endpoint will also be removed.`)) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, { method: "DELETE" });

      if (!response.ok) {
        notify({ type: "error", title: "Delete failed", description: "Unable to delete webhook." });
        return;
      }

      setWebhooks((current) => current.filter((item) => item.id !== webhook.id));
      setDeliveries((current) => current.filter((delivery) => delivery.webhookId !== webhook.id));
      notify({ type: "success", title: "Webhook deleted" });
    } catch (deleteError) {
      console.error("[webhooks] delete failed", deleteError);
      notify({ type: "error", title: "Network failed", description: "Unable to delete webhook." });
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTest(webhook: WebhookItem) {
    setIsBusy(true);

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/test`, { method: "POST" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        notify({ type: "error", title: "Test failed", description: payload?.error ?? "Unable to send test event." });
        return;
      }

      notify({ type: "success", title: "Test event sent" });
      await refreshDeliveries();
    } catch (testError) {
      console.error("[webhooks] test failed", testError);
      notify({ type: "error", title: "Network failed", description: "Unable to send test event." });
    } finally {
      setIsBusy(false);
    }
  }

  async function retryDelivery(delivery: WebhookDeliveryItem) {
    setIsBusy(true);

    try {
      const response = await fetch(`/api/webhooks/deliveries/${delivery.id}/retry`, { method: "POST" });

      if (!response.ok) {
        notify({ type: "error", title: "Retry failed", description: "Only failed deliveries can be retried." });
        return;
      }

      notify({ type: "success", title: "Delivery retried" });
      await refreshDeliveries();
    } catch (retryError) {
      console.error("[webhooks] retry failed", retryError);
      notify({ type: "error", title: "Network failed", description: "Unable to retry delivery." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-elevated/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-starlight">Webhook endpoints</h2>
            <p className="mt-1 text-sm text-silver">Send real-time Pay On Arc events to your backend.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} type="button">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Webhook
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-[#0B0F19]/40 p-8 text-center">
            <h3 className="text-lg font-semibold text-starlight">No webhooks yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-silver">
              Add an HTTPS endpoint to receive payment, link, API key, and merchant events.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="hidden grid-cols-[1fr_1.4fr_0.7fr_1fr_1.4fr] gap-4 border-b border-border bg-surface px-4 py-3 text-xs uppercase tracking-[0.12em] text-silver xl:grid">
              <span>Name</span>
              <span>Endpoint URL</span>
              <span>Status</span>
              <span>Last Delivery</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-border">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="grid gap-4 px-4 py-4 xl:grid-cols-[1fr_1.4fr_0.7fr_1fr_1.4fr] xl:items-center">
                  <div>
                    <p className="font-medium text-starlight">{webhook.name}</p>
                    <p className="mt-1 text-xs text-silver">{webhook.secret}</p>
                  </div>
                  <button
                    className="min-w-0 truncate rounded-lg border border-border bg-[#0B0F19]/50 px-3 py-2 text-left font-mono text-xs text-silver transition hover:border-primary/30"
                    onClick={() => void copyValue(webhook.url)}
                    type="button"
                  >
                    {webhook.url}
                  </button>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-xs capitalize ${statusClass(webhook.status)}`}>
                    {webhook.status}
                  </span>
                  <p className="text-sm text-silver">{lastDelivery(webhook)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={isBusy} onClick={() => setSelectedWebhook(webhook)} size="sm" type="button" variant="outline">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Button>
                    <Button disabled={isBusy} onClick={() => void sendTest(webhook)} size="sm" type="button" variant="outline">
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Test
                    </Button>
                    <Button disabled={isBusy} onClick={() => void patchWebhook(webhook, { regenerateSecret: true })} size="sm" type="button" variant="ghost">
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      Secret
                    </Button>
                    <Button disabled={isBusy} onClick={() => void patchWebhook(webhook, { enabled: !webhook.enabled })} size="sm" type="button" variant="ghost">
                      {webhook.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button disabled={isBusy} onClick={() => void deleteWebhook(webhook)} size="sm" type="button" variant="ghost">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-elevated/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-starlight">Recent deliveries</h2>
            <p className="mt-1 text-sm text-silver">Inspect webhook payloads, headers, responses, and retries.</p>
          </div>
          <Button onClick={() => void refreshDeliveries()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {deliveryFilters.map((filter) => (
            <button
              key={filter}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
                deliveryFilter === filter
                  ? "border-primary bg-primary/10 text-starlight"
                  : "border-border text-silver hover:border-primary/30 hover:text-starlight"
              }`}
              onClick={() => {
                setDeliveryFilter(filter);
                void refreshDeliveries(filter);
              }}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-[#0B0F19]/40 p-8 text-center">
            <h3 className="text-lg font-semibold text-starlight">No deliveries found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-silver">
              Send a test event or wait for payment activity to populate delivery history.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="hidden grid-cols-[1fr_1fr_0.7fr_0.7fr_0.7fr_auto] gap-4 border-b border-border bg-surface px-4 py-3 text-xs uppercase tracking-[0.12em] text-silver xl:grid">
              <span>Event</span>
              <span>Endpoint</span>
              <span>Status</span>
              <span>HTTP code</span>
              <span>Attempts</span>
              <span>Time</span>
            </div>
            <div className="divide-y divide-border">
              {filteredDeliveries.map((delivery) => (
                <div key={delivery.id} className="grid gap-4 px-4 py-4 xl:grid-cols-[1fr_1fr_0.7fr_0.7fr_0.7fr_auto] xl:items-center">
                  <div>
                    <p className="font-medium text-starlight">{delivery.eventType}</p>
                    <p className="mt-1 font-mono text-xs text-silver">{delivery.eventId}</p>
                  </div>
                  <p className="truncate text-sm text-silver">{delivery.webhookName}</p>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-xs capitalize ${statusClass(delivery.status)}`}>
                    {delivery.status}
                  </span>
                  <p className="text-sm text-silver">{delivery.responseStatus ?? "—"}</p>
                  <p className="text-sm text-silver">{delivery.attempt}</p>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button onClick={() => setSelectedDelivery(delivery)} size="sm" type="button" variant="outline">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Button>
                    {delivery.status === "failed" ? (
                      <Button disabled={isBusy} onClick={() => void retryDelivery(delivery)} size="sm" type="button" variant="ghost">
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Retry
                      </Button>
                    ) : null}
                    <p className="basis-full text-xs text-silver xl:basis-auto">{formatDate(delivery.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/80 p-4 py-8 backdrop-blur-md sm:p-6">
          <div className="relative my-auto w-full max-w-xl rounded-2xl border border-border bg-[#0B0F19] p-5 ring-1 ring-white/5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-starlight">{oneTimeSecret ? "Webhook secret" : "Create webhook"}</h3>
                <p className="mt-1 text-sm text-silver">
                  {oneTimeSecret ? "Copy this signing secret now. You will never see it again." : "HTTPS endpoints receive signed Pay On Arc events."}
                </p>
              </div>
              <button
                aria-label="Close webhook modal"
                className="rounded-lg p-2 text-silver transition hover:bg-white/10 hover:text-starlight"
                onClick={resetCreate}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {oneTimeSecret ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm leading-6 text-warning">
                  <div className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>Store this secret securely. Pay On Arc stores only a hash and cannot show it again.</p>
                  </div>
                </div>
                <textarea
                  className="min-h-24 w-full resize-none overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-[#0B0F19]/70 p-3 font-mono text-xs leading-5 text-starlight outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  readOnly
                  spellCheck={false}
                  value={oneTimeSecret}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button onClick={resetCreate} type="button" variant="outline">
                    Done
                  </Button>
                  <Button onClick={() => void copyValue(oneTimeSecret, "Webhook secret copied")} type="button">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy secret
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={createWebhook} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-starlight">Name</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-border bg-[#0B0F19]/60 px-3 py-2.5 text-sm text-starlight outline-none transition placeholder:text-silver/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={isBusy}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Production webhook"
                    value={name}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-starlight">Endpoint URL</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-border bg-[#0B0F19]/60 px-3 py-2.5 text-sm text-starlight outline-none transition placeholder:text-silver/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={isBusy}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com/webhooks/pay-on-arc"
                    type="url"
                    value={url}
                  />
                </label>
                {error ? <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
                <div className="flex justify-end gap-2">
                  <Button disabled={isBusy} onClick={resetCreate} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button disabled={isBusy} type="submit">
                    {isBusy ? "Creating..." : "Create webhook"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {selectedDelivery ? (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-[#0B0F19] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-starlight">Delivery details</h3>
                <p className="mt-1 text-sm text-silver">{selectedDelivery.eventType}</p>
              </div>
              <button
                aria-label="Close delivery details"
                className="rounded-lg p-2 text-silver transition hover:bg-white/10 hover:text-starlight"
                onClick={() => setSelectedDelivery(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <DetailBlock title="Payload" value={selectedDelivery.payload} />
              <DetailBlock title="Headers" value={selectedDelivery.requestHeaders ?? {}} />
              <DetailBlock title="Response" value={selectedDelivery.responseBody ?? "No response body recorded."} />
            </div>
          </aside>
        </div>
      ) : null}

      {selectedWebhook ? (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-[#0B0F19] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-starlight">Webhook endpoint</h3>
                <p className="mt-1 text-sm text-silver">{selectedWebhook.name}</p>
              </div>
              <button
                aria-label="Close webhook details"
                className="rounded-lg p-2 text-silver transition hover:bg-white/10 hover:text-starlight"
                onClick={() => setSelectedWebhook(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <DetailBlock
                title="Endpoint"
                value={{
                  id: selectedWebhook.id,
                  name: selectedWebhook.name,
                  url: selectedWebhook.url,
                  status: selectedWebhook.status,
                  secret: selectedWebhook.secret,
                  createdAt: selectedWebhook.createdAt,
                  updatedAt: selectedWebhook.updatedAt,
                  lastSuccessAt: selectedWebhook.lastSuccessAt,
                  lastFailureAt: selectedWebhook.lastFailureAt,
                }}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function DetailBlock({ title, value }: { title: string; value: unknown }) {
  const content = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <div>
      <h4 className="text-sm font-semibold text-starlight">{title}</h4>
      <pre className="mt-2 max-h-96 overflow-auto rounded-xl border border-border bg-[#0B0F19]/70 p-4 text-xs leading-5 text-silver">
        {content}
      </pre>
    </div>
  );
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
