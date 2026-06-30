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
    <main className="min-h-screen bg-[#0B0F19] px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ── */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <p className="text-sm font-semibold text-starlight">Pay On Arc</p>
              <p className="text-xs text-silver">Secure USDC checkout</p>
            </div>
          </Link>
          <StatusBadge status={pendingTransaction ? "PENDING" : status} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* ── Left: Merchant + Payment Info ── */}
          <div className="space-y-6">
            {/* Merchant identity */}
            <div className="rounded-2xl border border-border bg-elevated/60 p-5">
              <div className="flex items-center gap-4">
                {paymentLink.user.logoUrl ? (
                  <div
                    aria-label={`${merchantName} logo`}
                    className="h-12 w-12 shrink-0 rounded-xl border border-border bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url("${paymentLink.user.logoUrl}")` }}
                  />
                ) : (
                  <BrandLogo alt="Pay On Arc merchant" size="lg" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-starlight">{merchantName}</p>
                  <p className="font-mono text-xs text-silver">{shortAddress(merchantAddress)}</p>
                </div>
              </div>
              {paymentLink.user.supportEmail || paymentLink.user.websiteUrl ? (
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-silver">
                  {paymentLink.user.supportEmail ? (
                    <a className="flex items-center gap-1.5 transition hover:text-starlight" href={`mailto:${paymentLink.user.supportEmail}`}>
                      <span className="text-primary">✉</span> {paymentLink.user.supportEmail}
                    </a>
                  ) : null}
                  {paymentLink.user.websiteUrl ? (
                    <Link className="flex items-center gap-1.5 break-all transition hover:text-starlight" href={paymentLink.user.websiteUrl} target="_blank">
                      <span className="text-primary">↗</span> {paymentLink.user.websiteUrl}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Payment title */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">Payment request</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-starlight">{paymentLink.title}</h1>
              <p className="mt-2 text-sm leading-6 text-silver">
                {paymentLink.description ?? "USDC payment request on Arc Testnet."}
              </p>
            </div>

            {/* Amount */}
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
              <p className="text-xs text-silver">Amount due</p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-starlight">
                {Number(paymentLink.amount.toFixed(6)).toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-silver">{paymentLink.currency} · ERC-20 USDC on Arc Testnet</p>
            </div>

            {/* Details grid */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xs text-silver">Network</dt>
                <dd className="mt-1 font-medium text-starlight">Arc Testnet</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xs text-silver">Asset</dt>
                <dd className="mt-1 font-medium text-starlight">USDC</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xs text-silver">Recipient</dt>
                <dd className="mt-1 font-mono text-xs text-starlight">{shortAddress(merchantAddress)}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xs text-silver">Expires</dt>
                <dd className="mt-1 font-medium text-starlight">
                  {paymentLink.expiresAt ? paymentLink.expiresAt.toLocaleString() : "No expiry"}
                </dd>
              </div>
            </dl>
          </div>

          {/* ── Right: Checkout + Trust ── */}
          <div className="space-y-6">
            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: "Wallet-secured" },
                { icon: Lock, label: "One-time link" },
                { icon: CheckCircle2, label: "Auto-confirmed" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center">
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-[11px] font-medium text-starlight">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Checkout card */}
            <Card className="bg-elevated/70">
              <CardContent className="space-y-6 p-6">
                {pendingTransaction ? (
                  <div className="rounded-xl border border-warning/20 bg-warning/10 p-5">
                    <Clock className="h-7 w-7 text-warning" aria-hidden="true" />
                    <h2 className="mt-4 text-lg font-semibold text-starlight">Payment submitted</h2>
                    <p className="mt-2 text-sm leading-6 text-warning/80">
                      Waiting for network confirmation. This link is locked and cannot be paid again.
                    </p>
                    {pendingTransaction.txHash ? (
                      <Link className="mt-4 inline-flex items-center gap-2 break-all text-sm text-primary underline" href={getExplorerTxUrl(pendingTransaction.txHash)} target="_blank">
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
                        <Link className="inline-flex items-center gap-2 text-sm text-primary underline" href={getExplorerTxUrl(txHash)} target="_blank">
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

                {/* QR */}
                <div className="flex items-center justify-center">
                  <div className="rounded-xl border border-border bg-white p-2">
                    <QrCode value={paymentUrl} size={100} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-silver">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Secured by Pay On Arc · Direct USDC transfer to merchant wallet
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}