"use client";

import { Copy, ExternalLink, Loader2, Plus, QrCode as QrCodeIcon, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { StatusBadge } from "@/components/premium/status-badge";
import { EmptyState } from "@/components/premium/state-card";
import { useToast } from "@/components/premium/toast";
import { QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentLinkItem = {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  publicUrl: string;
};

export function PaymentLinksManager({ paymentLinks }: { paymentLinks: PaymentLinkItem[] }) {
  const [links, setLinks] = useState(paymentLinks);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<PaymentLinkItem | null>(null);
  const { notify } = useToast();

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      currency: String(formData.get("currency") ?? "USDC"),
      expiresAt: String(formData.get("expiresAt") ?? "") || undefined,
    };

    try {
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; paymentLink?: PaymentLinkItem } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not create payment link.");
      }

      setSuccess("Payment link created.");
      if (body?.paymentLink) {
        setLinks((current) => [body.paymentLink as PaymentLinkItem, ...current]);
        setCreatedLink(body.paymentLink as PaymentLinkItem);
        formElement.reset();
      }
      notify({ type: "success", title: "Payment link created" });
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Could not create payment link.";
      setError(message);
      notify({ type: "error", title: "Unexpected error", description: message });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDisable(id: string) {
    setError(null);
    setSuccess(null);
    setDisablingId(id);

    try {
      const response = await fetch(`/api/payment-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISABLED" }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not disable payment link.");
      }

      setSuccess("Payment link disabled.");
      setLinks((current) => current.map((link) => (link.id === id ? { ...link, status: "DISABLED" } : link)));
      notify({ type: "success", title: "Payment link disabled" });
    } catch (disableError) {
      const message = disableError instanceof Error ? disableError.message : "Could not disable payment link.";
      setError(message);
      notify({ type: "error", title: "Unexpected error", description: message });
    } finally {
      setDisablingId(null);
    }
  }

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesQuery =
        !query ||
        link.title.toLowerCase().includes(query.toLowerCase()) ||
        link.publicUrl.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || link.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [links, query, statusFilter]);

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden bg-elevated/60">
        <CardHeader>
          <CardTitle className="text-lg">Create payment link</CardTitle>
          <CardDescription>Generate a hosted Arc USDC checkout page with QR sharing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Title
              <input
                className="h-11 rounded-md border border-border bg-slate-950/70 px-3 text-white outline-none focus:border-violet-400"
                name="title"
                placeholder="Invoice #1042"
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Amount
              <input
                className="h-11 rounded-md border border-border bg-slate-950/70 px-3 text-white outline-none focus:border-violet-400"
                min="0.000001"
                name="amount"
                placeholder="100.00"
                required
                step="0.000001"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Currency
              <input
                className="h-11 rounded-md border border-border bg-slate-950/70 px-3 text-white outline-none focus:border-violet-400"
                defaultValue="USDC"
                name="currency"
                readOnly
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Expires at
              <input
                className="h-11 rounded-md border border-border bg-slate-950/70 px-3 text-white outline-none focus:border-violet-400"
                name="expiresAt"
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
              Description
              <textarea
                className="min-h-24 rounded-md border border-border bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-violet-400"
                name="description"
                placeholder="Optional memo for the payer"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <Button disabled={isCreating} type="submit">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                Create link
              </Button>
              {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {createdLink ? (
        <Card className="border-emerald-400/20 bg-emerald-400/10">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-lg font-semibold text-white">Payment Link Created</p>
              <p className="mt-1 break-all text-sm text-emerald-100/80">{createdLink.publicUrl}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton value={createdLink.publicUrl} />
              <Button asChild variant="outline">
                <Link href={createdLink.publicUrl} target="_blank">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open
                </Link>
              </Button>
              <Button onClick={() => setCreatedLink(null)} type="button" variant="ghost">
                Create another
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Payment links</h2>
            <p className="mt-1 text-sm text-slate-400">Search, filter, copy, and open payer checkout pages.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                className="h-10 rounded-md border border-border bg-slate-950/70 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-400"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search links"
                value={query}
              />
            </label>
            <select
              className="h-10 rounded-md border border-border bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-violet-400"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              {["ALL", "ACTIVE", "PAID", "DISABLED", "EXPIRED"].map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredLinks.length === 0 ? (
          <Card className="bg-elevated/60">
            <CardContent className="p-6">
              <EmptyState
                title={links.length === 0 ? "Create your first payment link" : "No payment links found"}
                description={
                  links.length === 0
                    ? "Generate a hosted USDC checkout page and share it with a customer."
                    : "Adjust your search or status filter to find the link you need."
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLinks.map((link) => (
              <Card key={link.id} className="bg-elevated/60 transition hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-premium">
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{link.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{link.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {link.status === "PAID" ? (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                            locked
                          </span>
                        ) : null}
                        <StatusBadge status={link.status} />
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-400 md:grid-cols-3">
                      <div>
                        <p className="text-slate-500">Amount</p>
                        <p className="font-medium text-white">
                          {Number(link.amount).toFixed(2)} {link.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Created</p>
                        <p className="font-medium text-white">{new Date(link.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Public URL</p>
                        <p className="break-all font-medium text-white">{link.publicUrl}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CopyLinkButton value={link.publicUrl} />
                      <Button asChild variant="outline">
                        <Link href={link.publicUrl} target="_blank">
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          Open Checkout
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <a href={`#qr-${link.id}`}>
                          <QrCodeIcon className="h-4 w-4" aria-hidden="true" />
                          View QR
                        </a>
                      </Button>
                      <Button disabled title="Duplicate link is coming soon" type="button" variant="outline">
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Duplicate
                      </Button>
                      {link.status === "ACTIVE" ? (
                        <Button disabled={disablingId === link.id} onClick={() => void handleDisable(link.id)} type="button" variant="ghost">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          {disablingId === link.id ? "Disabling" : "Disable"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div id={`qr-${link.id}`} className="rounded-xl border border-white/10 bg-white p-3 lg:text-right">
                    <QrCode value={link.publicUrl} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
