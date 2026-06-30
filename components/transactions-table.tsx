"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { CheckTransactionButton } from "@/components/check-transaction-button";
import { StatusBadge } from "@/components/premium/status-badge";
import { getExplorerTxUrl } from "@/lib/arc-config";

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  txHash: string | null;
  payerAddress: string | null;
  recipientAddress: string | null;
  createdAt: Date;
  paymentLink: { title: string } | null;
};

function shortenAddress(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="grid gap-3 p-4 md:hidden">
        {transactions.map((tx) => (
          <MobileTransactionCard key={tx.id} transaction={tx} />
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-silver">
            <tr>
              <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-silver">Amount</th>
              <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-silver">Status</th>
              <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-silver">Payer</th>
              <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-silver">Date</th>
              <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-silver">Details</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <DesktopTransactionRow key={tx.id} transaction={tx} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MobileTransactionCard({ transaction }: { transaction: Transaction }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-starlight">
            {Number(transaction.amount.toFixed(6)).toFixed(2)} {transaction.currency}
          </p>
          <p className="mt-0.5 text-xs text-silver">{transaction.paymentLink?.title ?? "Direct payment"}</p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-silver">
        <span className="font-mono">{transaction.payerAddress ? shortenAddress(transaction.payerAddress) : "Unknown"}</span>
        <span>{transaction.createdAt.toLocaleDateString()}</span>
      </div>
      {transaction.txHash ? (
        <Link className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline" href={getExplorerTxUrl(transaction.txHash)} target="_blank">
          View on ArcScan
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function DesktopTransactionRow({ transaction }: { transaction: Transaction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-border/50 transition hover:bg-white/[0.03] last:border-0">
        <td className="px-5 py-3">
          <p className="font-semibold text-starlight">
            {Number(transaction.amount.toFixed(6)).toFixed(2)} {transaction.currency}
          </p>
          <p className="mt-0.5 text-xs text-silver">{transaction.paymentLink?.title ?? "Direct payment"}</p>
        </td>
        <td className="px-5 py-3">
          {transaction.txHash && transaction.status === "PENDING" ? (
            <CheckTransactionButton initialStatus={transaction.status} transactionId={transaction.id} />
          ) : (
            <StatusBadge status={transaction.status} />
          )}
        </td>
        <td className="px-5 py-3 font-mono text-xs text-silver">
          {transaction.payerAddress ? shortenAddress(transaction.payerAddress) : "Unknown"}
        </td>
        <td className="px-5 py-3 text-xs text-silver">
          {transaction.createdAt.toLocaleString()}
        </td>
        <td className="px-5 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            type="button"
          >
            {expanded ? "Hide" : "View"}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="bg-surface/50">
          <td colSpan={5} className="px-5 py-3">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-silver">Recipient</p>
                <p className="mt-1 font-mono text-starlight">
                  {transaction.recipientAddress ? shortenAddress(transaction.recipientAddress) : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-silver">Tx Hash</p>
                <p className="mt-1 font-mono text-starlight break-all">
                  {transaction.txHash ? shortenAddress(transaction.txHash) : "Simulated"}
                </p>
              </div>
              <div>
                <p className="text-silver">Explorer</p>
                {transaction.txHash ? (
                  <Link className="mt-1 inline-flex items-center gap-1 text-primary underline" href={getExplorerTxUrl(transaction.txHash)} target="_blank">
                    View on ArcScan
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="mt-1 text-silver">N/A</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}