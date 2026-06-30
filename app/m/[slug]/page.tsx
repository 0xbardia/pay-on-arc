import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Globe, Mail, Wallet } from "lucide-react";
import { PaymentLinkStatus } from "@prisma/client";
import { BrandLogo } from "@/components/brand-logo";
import { StatusBadge } from "@/components/premium/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMerchantDisplayName } from "@/lib/merchant-profile";
import { getPaymentUrl, getRequestOrigin } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MerchantPageProps = {
  params: Promise<{ slug: string }>;
};

async function getMerchant(slug: string) {
  return prisma.user.findUnique({
    where: { merchantSlug: slug },
    include: {
      wallets: { orderBy: { lastConnectedAt: "desc" }, take: 1 },
      paymentLinks: {
        where: {
          status: PaymentLinkStatus.ACTIVE,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });
}

function shortAddress(address?: string | null) {
  return address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Wallet not configured";
}

export async function generateMetadata({ params }: MerchantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await prisma.user.findUnique({
    where: { merchantSlug: slug },
    select: { merchantName: true, logoUrl: true, websiteUrl: true },
  });

  if (!merchant) {
    return {
      title: "Merchant not found | Pay On Arc",
    };
  }

  const title = `${getMerchantDisplayName(merchant)} | Pay On Arc Merchant`;
  const description = `View active USDC payment links for ${getMerchantDisplayName(merchant)} on Pay On Arc.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: merchant.websiteUrl ?? undefined,
      images: merchant.logoUrl ? [{ url: merchant.logoUrl }] : undefined,
    },
  };
}

export default async function MerchantPage({ params }: MerchantPageProps) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const requestOrigin = getRequestOrigin(requestHeaders);
  const merchant = await getMerchant(slug);

  if (!merchant) {
    notFound();
  }

  const merchantName = getMerchantDisplayName(merchant);
  const walletAddress = merchant.wallets[0]?.address ?? null;

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <p className="text-sm font-semibold text-white">Pay On Arc</p>
            <p className="text-xs text-slate-500">Merchant profile</p>
          </div>
        </Link>

        <Card className="overflow-hidden bg-elevated/70">
          <div className="h-28 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.32),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]" />
          <CardContent className="-mt-10 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {merchant.logoUrl ? (
                  <div
                    aria-label={`${merchantName} logo`}
                    className="h-20 w-20 rounded-2xl border border-white/10 bg-cover bg-center bg-slate-950 shadow-premium"
                    role="img"
                    style={{ backgroundImage: `url("${merchant.logoUrl}")` }}
                  />
                ) : (
                  <BrandLogo alt="Pay On Arc merchant" className="rounded-2xl shadow-premium" size="xl" />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">{merchantName}</h1>
                  <p className="mt-2 font-mono text-sm text-slate-400">{shortAddress(walletAddress)}</p>
                </div>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-semibold text-white">Merchant overview</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {merchantName} accepts Arc Testnet USDC through secure Pay On Arc checkout links. Open an active payment
                  request below to pay with a connected EVM wallet.
                </p>
              </div>
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm">
                {merchant.websiteUrl ? (
                  <Link className="flex items-center gap-2 break-all text-slate-300 transition hover:text-white" href={merchant.websiteUrl} target="_blank">
                    <Globe className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    Website
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </Link>
                ) : null}
                {merchant.supportEmail ? (
                  <a className="flex items-center gap-2 break-all text-slate-300 transition hover:text-white" href={`mailto:${merchant.supportEmail}`}>
                    <Mail className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    {merchant.supportEmail}
                  </a>
                ) : null}
                {!merchant.websiteUrl && !merchant.supportEmail ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Wallet className="h-4 w-4 text-violet-300" aria-hidden="true" />
                    Wallet-secured merchant
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Active payment links</CardTitle>
            <CardDescription>Recent payment requests currently accepting USDC.</CardDescription>
          </CardHeader>
          <CardContent>
            {merchant.paymentLinks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
                <h2 className="text-lg font-semibold text-white">No active payment links</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  This merchant does not have public active payment requests right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {merchant.paymentLinks.map((link) => (
                  <div
                    key={link.id}
                    className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/30 hover:bg-white/[0.06] sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{link.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {Number(link.amount.toFixed(6)).toFixed(2)} {link.currency}
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={getPaymentUrl(link.slug, requestOrigin)}>
                        Open checkout
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">Secured by Pay On Arc</p>
      </div>
    </main>
  );
}
