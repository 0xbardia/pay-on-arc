"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Key, Plus, Shield, Trash2, X } from "lucide-react";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";

export type ApiKeyListItem = {
  id: string;
  name: string;
  prefix: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  status: string;
};

type ApiKeysManagerProps = {
  initialApiKeys: ApiKeyListItem[];
};

const keyNameExamples = ["Production", "Backend Server", "Webhook Worker"];

function formatDate(value: string | null) {
  if (!value) {
    return "Never used";
  }

  return new Date(value).toLocaleString();
}

function statusClasses(status: string) {
  return status === "active"
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
    : "border-silver/20 bg-silver/10 text-silver";
}

export function ApiKeysManager({ initialApiKeys }: ApiKeysManagerProps) {
  const { notify } = useToast();
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingKey, setRevokingKey] = useState<ApiKeyListItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const activeCount = useMemo(() => apiKeys.filter((key) => key.status === "active").length, [apiKeys]);

  function resetCreateModal() {
    setIsCreateOpen(false);
    setName("");
    setCreatedRawKey(null);
    setError(null);
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
      console.error("[api-keys] clipboard copy failed", copyError);
      try {
        fallbackCopy(value);
        notify({ type: "info", title });
      } catch (fallbackError) {
        console.error("[api-keys] fallback copy failed", fallbackError);
        notify({ type: "error", title: "Copy failed", description: "Select the key manually and copy it." });
      }
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json().catch(() => null)) as {
        apiKey?: ApiKeyListItem;
        rawKey?: string;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.apiKey || !payload.rawKey) {
        setError(payload?.message ?? payload?.error ?? "Unable to create API key.");
        notify({ type: "error", title: "API key creation failed", description: payload?.message ?? "Try again." });
        return;
      }

      setApiKeys((current) => [payload.apiKey as ApiKeyListItem, ...current]);
      setCreatedRawKey(payload.rawKey);
      notify({ type: "success", title: "API key created", description: "Copy the key now. It will only be shown once." });
    } catch (createError) {
      console.error("[api-keys] create failed", createError);
      setError("Network failed. Try again.");
      notify({ type: "error", title: "Network failed", description: "Unable to create API key." });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke() {
    if (!revokingKey) {
      return;
    }

    setIsRevoking(true);

    try {
      const response = await fetch(`/api/api-keys/${revokingKey.id}/revoke`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        apiKey?: { id: string; revokedAt: string; status: string };
        error?: string;
      } | null;

      if (!response.ok || !payload?.apiKey) {
        notify({ type: "error", title: "Revoke failed", description: payload?.error ?? "Try again." });
        return;
      }

      setApiKeys((current) =>
        current.map((key) =>
          key.id === payload.apiKey?.id
            ? { ...key, revokedAt: payload.apiKey.revokedAt, status: payload.apiKey.status }
            : key,
        ),
      );
      notify({ type: "success", title: "API key revoked", description: `${revokingKey.name} can no longer authenticate.` });
      setRevokingKey(null);
    } catch (revokeError) {
      console.error("[api-keys] revoke failed", revokeError);
      notify({ type: "error", title: "Network failed", description: "Unable to revoke API key." });
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Create restricted merchant credentials for server-to-server Pay On Arc API access.
          </p>
          <p className="mt-1 text-xs text-slate-500">{activeCount} active API key{activeCount === 1 ? "" : "s"}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create API Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Key className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">No API keys yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            Create a key for your backend server when you are ready to call the Pay On Arc merchant API.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="hidden grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] gap-4 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500 lg:grid">
            <span>Name</span>
            <span>Prefix</span>
            <span>Created</span>
            <span>Last used</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/10">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-medium text-white">{apiKey.name}</p>
                  <p className="mt-1 text-xs text-slate-500 lg:hidden">Created {formatDate(apiKey.createdAt)}</p>
                </div>
                <button
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-left font-mono text-xs text-slate-300 transition hover:border-violet-400/30"
                  onClick={() => void copyValue(apiKey.prefix)}
                  type="button"
                >
                  <span className="truncate">{apiKey.prefix}</span>
                  <Copy className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                </button>
                <p className="hidden text-sm text-slate-400 lg:block">{formatDate(apiKey.createdAt)}</p>
                <p className="text-sm text-slate-400">{formatDate(apiKey.lastUsedAt)}</p>
                <div className="flex items-center justify-between gap-3 lg:justify-end">
                  <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${statusClasses(apiKey.status)}`}>
                    {apiKey.status}
                  </span>
                  {apiKey.status === "active" ? (
                    <Button onClick={() => setRevokingKey(apiKey)} size="sm" type="button" variant="ghost">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCreateOpen ? (
        <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/80 p-4 py-8 backdrop-blur-md sm:p-6">
          <div className="relative my-auto w-full max-w-xl rounded-2xl border border-border bg-[#0B0F19] p-5 ring-1 ring-white/5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Create API Key</h3>
                <p className="mt-1 text-sm text-slate-400">Name the key so you can identify where it is used.</p>
              </div>
              <button
                aria-label="Close create API key modal"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                onClick={resetCreateModal}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {createdRawKey ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    <p className="font-medium">API key created</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                    Copy this key now. You will never see it again.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300" htmlFor="created-api-key">
                    Full API key
                  </label>
                  <textarea
                    className="min-h-24 w-full resize-none overflow-x-auto whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
                    id="created-api-key"
                    readOnly
                    spellCheck={false}
                    value={createdRawKey}
                  />
                  <p className="text-xs text-slate-500">
                    This temporary value is cleared when you close the modal. The list below will only show the masked prefix.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button onClick={resetCreateModal} type="button" variant="outline">
                    Done
                  </Button>
                  <Button onClick={() => void copyValue(createdRawKey, "API key copied")} type="button">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy API key
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Name</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
                    disabled={isCreating}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Backend Server"
                    value={name}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {keyNameExamples.map((example) => (
                    <button
                      key={example}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-white"
                      disabled={isCreating}
                      onClick={() => setName(example)}
                      type="button"
                    >
                      {example}
                    </button>
                  ))}
                </div>
                {error ? (
                  <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                  <div className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>Store API keys securely. They authenticate merchant API requests from your server.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button disabled={isCreating} onClick={resetCreateModal} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button disabled={isCreating} type="submit">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    {isCreating ? "Creating..." : "Generate key"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {revokingKey ? (
        <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/80 p-4 py-8 backdrop-blur-md sm:p-6">
          <div className="relative my-auto w-full max-w-md rounded-2xl border border-border bg-[#0B0F19] p-5 ring-1 ring-white/5 sm:p-6">
            <h3 className="text-lg font-semibold text-white">Revoke API key?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Are you sure? <span className="font-medium text-white">{revokingKey.name}</span> will stop authenticating
              immediately.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button disabled={isRevoking} onClick={() => setRevokingKey(null)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isRevoking} onClick={() => void handleRevoke()} type="button">
                {isRevoking ? "Revoking..." : "Revoke"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("document.execCommand copy failed");
  }
}
