import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { CheckCircle2, Clock, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { PaymentActions } from "@/components/payment-actions";
import { QrCode } from "@/components/qr-code";
import { StatusBadge } from "@/components/premium/status-badge";
import { ErrorState, SuccessState } from "@/components/premium/state-card";
import { Card, CardContent } from "@/components/ui/card";
import { enableSimulatedPayments, getExplorerTxUrl } from "@/lib/arc-config";
import { getMerchantDisplayName } from "@/lib/merchant-profile";
import { getPaymentUrl, getRequestOrigin, isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PaymentPageProps = {
  params: Promise<{ slug: string }>;
};

function shortAddress(address?: string | null) {
  return address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not configured";
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const requestOrigin = getRequestOrigin(requestHeaders);
  const paymentLink = await prisma.paymentLink.findUnique({
    where: { slug },
    include: {
      user: { include: { wallets: { orderBy: { lastConnectedAt: "desc" }, take: 1 } } },
      transactions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!paymentLink) {
    notFound();
  }

  const status =
    paymentLink.status === PaymentLinkStatus.ACTIVE && isPaymentLinkExpired(paymentLink.expiresAt)
      ? PaymentLinkStatus.EXPIRED
      : paymentLink.status;
  const latestTransaction = paymentLink.transactions[0] ?? null;
  const pendingTransaction = latestTransaction?.status === TransactionStatus.PENDING ? latestTransaction : null;
  const merchantAddress = paymentLink.user.wallets[0]?.address ?? null;
  const merchantName = getMerchantDisplayName(paymentLink.user);
  const paymentUrl = getPaymentUrl(paymentLink.slug, requestOrigin);
  const isUnavailable = status !== PaymentLinkStatus.ACTIVE || Boolean(pendingTransaction);
  const txHash = latestTransaction?.txHash;

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <p className="text-sm font-semibold text-white">Pay On Arc</p>
              <p className="text-xs text-slate-500">Secure USDC checkout</p>
            </div>
          </Link>
          <StatusBadge status={pendingTransaction ? "PENDING" : status} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-elevated/70">
            <CardContent className="space-y-5 p-6">
              <div className="rounded-xl border border-border bg-white/[0.03] p-5">
                <p className="text-sm text-slate-400">Merchant</p>
                <div className="mt-3 flex items-center gap-3">
                  {paymentLink.user.logoUrl ? (
                    <div
                      aria-label={`${merchantName} logo`}
                      className="h-11 w-11 rounded-xl border border-white/10 bg-cover bg-center bg-white/[0.04]"
                      role="img"
                      style={{ backgroundImage: `url("${paymentLink.user.logoUrl}")` }}
                    />
                  ) : (
                    <BrandLogo alt="Pay On Arc merchant" size="lg" />
                  )}
                  <div>
                    <p className="font-semibold text-white">{merchantName}</p>
                    <p className="font-mono text-xs text-slate-400">{shortAddress(merchantAddress)}</p>
                  </div>
                </div>
                {paymentLink.user.supportEmail || paymentLink.user.websiteUrl ? (
                  <div className="mt-4 grid gap-2 text-xs text-slate-400">
                    {paymentLink.user.supportEmail ? (
                      <a className="transition hover:text-white" href={`mailto:${paymentLink.user.supportEmail}`}>
                        Support: {paymentLink.user.supportEmail}
                      </a>
                    ) : null}
                    {paymentLink.user.websiteUrl ? (
                      <Link className="break-all transition hover:text-white" href={paymentLink.user.websiteUrl} target="_blank">
                        {paymentLink.user.websiteUrl}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-sm text-slate-400">Payment request</p>
                <h1 className="mt-2 text-3xl font-bold text-white">{paymentLink.title}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {paymentLink.description ?? "USDC payment request on Arc Testnet."}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
                <p className="text-sm text-violet-200">Amount due</p>
                <p className="mt-2 text-5xl font-bold text-white">
                  {Number(paymentLink.amount.toFixed(6)).toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-slate-300">{paymentLink.currency} · ERC-20 USDC</p>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-white/[0.03] p-4">
                  <dt className="text-slate-500">Network</dt>
                  <dd className="mt-1 font-medium text-white">Arc Testnet</dd>
                </div>
                <div className="rounded-xl border border-border bg-white/[0.03] p-4">
                  <dt className="text-slate-500">Asset</dt>
                  <dd className="mt-1 font-medium text-white">USDC</dd>
                </div>
                <div className="rounded-xl border border-border bg-white/[0.03] p-4">
                  <dt className="text-slate-500">Recipient</dt>
                  <dd className="mt-1 font-mono text-xs text-white">{shortAddress(merchantAddress)}</dd>
                </div>
                <div className="rounded-xl border border-border bg-white/[0.03] p-4">
                  <dt className="text-slate-500">Expires</dt>
                  <dd className="mt-1 font-medium text-white">
                    {paymentLink.expiresAt ? paymentLink.expiresAt.toLocaleString() : "No expiry"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="bg-elevated/70">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Checkout</p>
                  <p className="mt-1 text-sm text-slate-400">Connect wallet and pay with Arc Testnet USDC.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white p-3">
                  <QrCode value={paymentUrl} size={132} />
                </div>
              </div>

              {pendingTransaction ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
                  <Clock className="h-7 w-7 text-amber-300" aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-semibold text-white">Payment submitted</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-100/80">
                    Waiting for network confirmation. This link is locked and cannot be paid again.
                  </p>
                  {pendingTransaction.txHash ? (
                    <Link className="mt-4 inline-flex items-center gap-2 break-all text-sm underline" href={getExplorerTxUrl(pendingTransaction.txHash)} target="_blank">
                      {pendingTransaction.txHash}
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              ) : status === PaymentLinkStatus.PAID ? (
                <SuccessState
                  title="Payment completed successfully"
                  description="This payment link has already been paid and is now closed."
                  footer={
                    txHash ? (
                      <Link className="inline-flex items-center gap-2 text-sm underline" href={getExplorerTxUrl(txHash)} target="_blank">
                        View on ArcScan
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null
                  }
                />
              ) : status === PaymentLinkStatus.ACTIVE ? (
                <PaymentActions
                  amount={paymentLink.amount.toString()}
                  disabled={isUnavailable}
                  enableSimulatedPayments={enableSimulatedPayments}
                  merchantAddress={merchantAddress}
                  slug={paymentLink.slug}
                />
              ) : (
                <ErrorState
                  title="Payment link unavailable"
                  description={`This payment link is ${status.toLowerCase()} and can no longer accept payment.`}
                />
              )}

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: "Wallet-secured" },
                  { icon: Lock, label: "One-time link" },
                  { icon: CheckCircle2, label: "Auto-confirmed" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-300">
                    <item.icon className="h-4 w-4 text-violet-300" aria-hidden="true" />
                    {item.label}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-slate-500">Secured by Pay On Arc</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
