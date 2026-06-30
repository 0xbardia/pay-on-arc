import Link from "next/link";
import { headers } from "next/headers";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { Download, Search } from "lucide-react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { PageHeader } from "@/components/premium/page-header";
import { EmptyState } from "@/components/premium/state-card";
import { TransactionsTable } from "@/components/transactions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { logDevRequest } from "@/lib/dev-log";
import { getPaymentUrl, getRequestOrigin } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; q?: string; range?: string }> };

const filters = ["ALL", "SIMULATED", "PENDING", "CONFIRMED", "FAILED"] as const;
const ranges = ["7D", "30D", "90D", "ALL"] as const;

export default async function TransactionsPage({ searchParams }: Props) {
  logDevRequest("GET /app/transactions");
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const { status = "ALL", q = "", range = "ALL" } = await searchParams;
  const normalizedStatus = status.toUpperCase();
  const normalizedRange = range.toUpperCase();
  const statusFilter =
    normalizedStatus !== "ALL" && normalizedStatus in TransactionStatus
      ? (normalizedStatus as TransactionStatus)
      : undefined;
  const days = normalizedRange === "7D" ? 7 : normalizedRange === "30D" ? 30 : normalizedRange === "90D" ? 90 : null;
  const createdAtFilter = days ? { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } : undefined;
  const search = q.trim();
  const requestHeaders = await headers();
  const requestOrigin = getRequestOrigin(requestHeaders);
  const [transactions, totalTransactions, activePaymentLinkCount, latestActivePaymentLink] =
    await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: auth.user.id,
          status: statusFilter,
          createdAt: createdAtFilter,
          ...(search
            ? { OR: [
                { txHash: { contains: search, mode: "insensitive" } },
                { payerAddress: { contains: search, mode: "insensitive" } },
                { paymentLink: { title: { contains: search, mode: "insensitive" } } },
              ]}
            : {}),
        },
        include: { paymentLink: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({ where: { userId: auth.user.id } }),
      prisma.paymentLink.count({ where: { userId: auth.user.id, status: PaymentLinkStatus.ACTIVE } }),
      prisma.paymentLink.findFirst({
        where: { userId: auth.user.id, status: PaymentLinkStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
      }),
    ]);
  const latestPaymentUrl = latestActivePaymentLink
    ? getPaymentUrl(latestActivePaymentLink.slug, requestOrigin)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Merchant"
        title="Transactions"
        description="Payment links are requests. Transactions are created only after a payment attempt."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/api/transactions/export">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Link>
          </Button>
        }
      />

      {/* ── Search + Range ── */}
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-silver" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-lg border border-border bg-[#0B0F19]/70 pl-9 pr-3 text-sm text-starlight outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={q}
            name="q"
            placeholder="Search by tx hash, payment title, or payer"
          />
        </label>
        <select className="h-10 rounded-lg border border-border bg-[#0B0F19]/70 px-3 text-sm text-starlight outline-none" defaultValue={normalizedRange} name="range">
          {ranges.map((item) => (<option key={item} value={item}>{item.toLowerCase()}</option>))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {/* ── Status Filter Chips (replaces duplicated select) ── */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              normalizedStatus === filter
                ? "border-primary bg-primary/10 text-starlight"
                : "border-border text-silver hover:text-starlight"
            }`}
            href={`/app/transactions?status=${filter}&range=${normalizedRange}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {filter.toLowerCase()}
          </Link>
        ))}
      </div>

      {/* ── Table/Card List ── */}
      <Card className="overflow-hidden bg-elevated/60">
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            totalTransactions === 0 ? (
              <div className="space-y-5 p-6">
                <EmptyState title="No transactions yet" description="Transactions are created only after a payment attempt. Create a payment link and share it with a customer." />
                <div className="rounded-lg border border-border bg-[#0B0F19]/60 p-4">
                  <p className="text-sm text-silver">Active payment links</p>
                  <p className="mt-1 text-2xl font-semibold text-starlight">{activePaymentLinkCount}</p>
                  {latestPaymentUrl ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <CopyLinkButton value={latestPaymentUrl} />
                      <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]" href={latestPaymentUrl} target="_blank">Open latest link</Link>
                    </div>
                  ) : null}
                </div>
                <Button asChild><Link href="/app/payments">Go to payments</Link></Button>
              </div>
            ) : (
              <div className="p-6 text-sm text-silver">No transactions match this filter yet.</div>
            )
          ) : (
            <TransactionsTable transactions={transactions.map((t) => ({
  id: t.id,
  amount: Number(t.amount),
  currency: t.currency,
  status: t.status,
  txHash: t.txHash,
  payerAddress: t.payerAddress,
  recipientAddress: t.recipientAddress,
  createdAt: t.createdAt,
  paymentLink: t.paymentLink ? { title: t.paymentLink.title } : null,
}))} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}