import Link from "next/link";
import { TransactionStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { CheckTransactionButton } from "@/components/check-transaction-button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminPanelPath } from "@/lib/admin";
import { getExplorerTxUrl } from "@/lib/arc-config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminTransactionsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const filters = ["ALL", "PENDING", "CONFIRMED", "FAILED", "SIMULATED"] as const;

function shorten(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default async function AdminTransactionsPage({ searchParams }: AdminTransactionsPageProps) {
  const { status = "ALL" } = await searchParams;
  const normalizedStatus = status.toUpperCase();
  const adminPath = getAdminPanelPath();
  const statusFilter =
    normalizedStatus !== "ALL" && normalizedStatus in TransactionStatus
      ? (normalizedStatus as TransactionStatus)
      : undefined;
  const transactions = await prisma.transaction.findMany({
    where: { status: statusFilter },
    include: { paymentLink: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Transactions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Monitor platform-wide Arc Testnet USDC payment attempts and receipt status.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter}
            className={`rounded-md border px-3 py-2 text-sm ${
              normalizedStatus === filter
                ? "border-violet-400 bg-violet-500/15 text-white"
                : "border-slate-800 text-slate-400 hover:text-white"
            }`}
            href={filter === "ALL" ? `${adminPath}/transactions` : `${adminPath}/transactions?status=${filter}`}
          >
            {filter.toLowerCase()}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Payment link</th>
                  <th className="px-5 py-3 font-medium">Payer</th>
                  <th className="px-5 py-3 font-medium">Recipient</th>
                  <th className="px-5 py-3 font-medium">Tx hash</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-900 last:border-0">
                    <td className="px-5 py-4 font-medium text-white">
                      {Number(transaction.amount.toFixed(6)).toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {transaction.paymentLink?.title ?? "Direct payment"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {transaction.payerAddress ? shorten(transaction.payerAddress) : "Unknown"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {transaction.recipientAddress ? shorten(transaction.recipientAddress) : "Unknown"}
                    </td>
                    <td className="px-5 py-4">
                      {transaction.txHash ? (
                        <Link
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-violet-200 underline"
                          href={getExplorerTxUrl(transaction.txHash)}
                          target="_blank"
                        >
                          {shorten(transaction.txHash)}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="text-slate-400">Simulated</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {transaction.txHash && transaction.status === TransactionStatus.PENDING ? (
                        <CheckTransactionButton
                          initialStatus={transaction.status}
                          transactionId={transaction.id}
                        />
                      ) : (
                        transaction.status
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400">{transaction.createdAt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 ? <p className="p-6 text-sm text-slate-400">No transactions found.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
