import Link from "next/link";
import { headers } from "next/headers";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { Download, ExternalLink, Search } from "lucide-react";
import { CheckTransactionButton } from "@/components/check-transaction-button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { PageHeader } from "@/components/premium/page-header";
import { StatusBadge } from "@/components/premium/status-badge";
import { EmptyState } from "@/components/premium/state-card";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { logDevRequest } from "@/lib/dev-log";
import { getExplorerTxUrl } from "@/lib/arc-config";
import { getPaymentUrl, getRequestOrigin } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TransactionsPageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    range?: string;
  }>;
};

const filters = ["ALL", "SIMULATED", "PENDING", "CONFIRMED", "FAILED"] as const;
const ranges = ["7D", "30D", "90D", "ALL"] as const;

function shortenAddress(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  logDevRequest("GET /app/transactions");
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return null;
  }

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
            ? {
                OR: [
                  { txHash: { contains: search, mode: "insensitive" } },
                  { payerAddress: { contains: search, mode: "insensitive" } },
                  { paymentLink: { title: { contains: search, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: { paymentLink: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({
        where: {
          userId: auth.user.id,
        },
      }),
      prisma.paymentLink.count({
        where: {
          userId: auth.user.id,
          status: PaymentLinkStatus.ACTIVE,
        },
      }),
      prisma.paymentLink.findFirst({
        where: {
          userId: auth.user.id,
          status: PaymentLinkStatus.ACTIVE,
        },
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
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white/[0.03] px-4 text-sm text-slate-400"
            disabled
            type="button"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs">Coming soon</span>
          </button>
        }
      />
      <form className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-md border border-border bg-slate-950/70 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-400"
            defaultValue={q}
            name="q"
            placeholder="Search by tx hash, payment title, or payer"
          />
        </label>
        <select className="h-10 rounded-md border border-border bg-slate-950/70 px-3 text-sm text-white" defaultValue={normalizedStatus} name="status">
          {filters.map((filter) => (
            <option key={filter} value={filter}>{filter.toLowerCase()}</option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-border bg-slate-950/70 px-3 text-sm text-white" defaultValue={normalizedRange} name="range">
          {ranges.map((item) => (
            <option key={item} value={item}>{item.toLowerCase()}</option>
          ))}
        </select>
        <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white" type="submit">
          Apply
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter}
            className={`rounded-full border px-3 py-2 text-sm ${
              normalizedStatus === filter
                ? "border-violet-400 bg-violet-500/15 text-white"
                : "border-slate-800 text-slate-400 hover:text-white"
            }`}
            href={`/app/transactions?status=${filter}&range=${normalizedRange}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {filter.toLowerCase()}
          </Link>
        ))}
      </div>
      <Card className="overflow-hidden bg-elevated/60">
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            totalTransactions === 0 ? (
              <div className="space-y-5 p-6">
                <EmptyState
                  title="No transactions yet"
                  description="Transactions are created only after a payment attempt. Create a payment link and share it with a customer."
                />
                <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-500">Active payment links</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{activePaymentLinkCount}</p>
                  {latestPaymentUrl ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <CopyLinkButton value={latestPaymentUrl} />
                      <Link
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-800 px-4 text-sm font-medium text-slate-200 hover:bg-slate-900"
                        href={latestPaymentUrl}
                        target="_blank"
                      >
                        Open latest link
                      </Link>
                    </div>
                  ) : null}
                </div>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
                  href="/app/payments"
                >
                  Go to payments
                </Link>
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-400">No transactions match this filter yet.</div>
            )
          ) : (
            <>
            <div className="grid gap-3 p-4 md:hidden">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-xl border border-border bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {Number(transaction.amount.toFixed(6)).toFixed(2)} {transaction.currency}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{transaction.paymentLink?.title ?? "Direct payment"}</p>
                    </div>
                    <StatusBadge status={transaction.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-slate-400">
                    <p>Payer: {transaction.payerAddress ? shortenAddress(transaction.payerAddress) : "Unknown"}</p>
                    <p>Recipient: {transaction.recipientAddress ? shortenAddress(transaction.recipientAddress) : "Unknown"}</p>
                    <p>Date: {transaction.createdAt.toLocaleString()}</p>
                    {transaction.txHash ? (
                      <Link className="inline-flex items-center gap-1.5 text-violet-200 underline" href={getExplorerTxUrl(transaction.txHash)} target="_blank">
                        View on ArcScan
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Payer</th>
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Explorer</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-900 transition hover:bg-white/[0.03] last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {Number(transaction.amount.toFixed(6)).toFixed(2)} {transaction.currency}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{transaction.paymentLink?.title ?? "Direct payment"}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {transaction.txHash && transaction.status === TransactionStatus.PENDING ? (
                          <CheckTransactionButton
                            initialStatus={transaction.status}
                            transactionId={transaction.id}
                          />
                        ) : (
                          <StatusBadge status={transaction.status} />
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {transaction.payerAddress ? shortenAddress(transaction.payerAddress) : "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {transaction.recipientAddress
                          ? shortenAddress(transaction.recipientAddress)
                          : "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {transaction.createdAt.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {transaction.txHash ? (
                          <Link
                            className="inline-flex items-center gap-1.5 text-violet-200 underline"
                            href={getExplorerTxUrl(transaction.txHash)}
                            target="_blank"
                          >
                            {shortenAddress(transaction.txHash)}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        ) : (
                          "Simulated"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
