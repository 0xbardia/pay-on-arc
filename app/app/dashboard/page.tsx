import Link from "next/link";
import { headers } from "next/headers";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ExternalLink,
  Globe,
  Key,
  Link2,
  Plus,
  Receipt,
  TrendingUp,
  WalletCards,
  Webhook,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { StatusBadge } from "@/components/premium/status-badge";
import { RevenueChartLoader } from "@/components/premium/revenue-chart-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getDashboardStats,
  getRecentTransactions,
  getRevenueSeries,
  getTopPaymentLinks,
  parseAnalyticsPeriod,
} from "@/lib/dashboard-analytics";
import { logDevRequest } from "@/lib/dev-log";
import { getMerchantDisplayName } from "@/lib/merchant-profile";
import { getPaymentUrl, getRequestOrigin } from "@/lib/payment-links";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ period?: string }>;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function shortAddress(value?: string | null) {
  return value ? `${value.slice(0, 8)}...${value.slice(-6)}` : "Wallet not configured";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  logDevRequest("GET /app/dashboard");
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const { period: periodParam } = await searchParams;
  const period = parseAnalyticsPeriod(periodParam);
  const requestHeaders = await headers();
  const requestOrigin = getRequestOrigin(requestHeaders);
  const [stats, chartData, topLinks, recentTransactions] = await Promise.all([
    getDashboardStats(auth.user.id),
    getRevenueSeries(auth.user.id, period),
    getTopPaymentLinks(auth.user.id),
    getRecentTransactions(auth.user.id),
  ]);
  const merchantName = getMerchantDisplayName(auth.user);
  const merchantWallet = auth.wallet.address;
  const hasPaymentActivity = stats.successfulPayments > 0 || stats.totalTransactions > 0;
  const latestTopLink = topLinks[0] ?? null;
  const hasAlerts = stats.failedPayments > 0 || stats.pendingPayments > 0;
  const onboardingItems = [
    { label: "Wallet connected", complete: Boolean(auth.wallet.address), href: "/app/settings" },
    { label: "Merchant profile branded", complete: Boolean(auth.user.merchantName || auth.user.logoUrl), href: "/app/settings" },
    { label: "Payment link created", complete: stats.activePaymentLinks + stats.paidLinks > 0, href: "/app/payments" },
    { label: "First payment received", complete: stats.successfulPayments > 0, href: "/app/payments" },
  ];
  const completedOnboarding = onboardingItems.filter((item) => item.complete).length;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">
            {hasPaymentActivity ? "Merchant dashboard" : "Getting started"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-starlight">{merchantName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!hasPaymentActivity ? (
            <Button asChild size="lg">
              <Link href="/app/payments"><Plus className="h-4 w-4" aria-hidden="true" />Create your first payment link</Link>
            </Button>
          ) : (
            <>
              <Button asChild><Link href="/app/payments"><Plus className="h-4 w-4" aria-hidden="true" />Create Payment Link</Link></Button>
              <Button asChild variant="outline"><Link href="/app/transactions"><Receipt className="h-4 w-4" aria-hidden="true" />Transactions</Link></Button>
            </>
          )}
        </div>
      </div>

      {/* ── Empty State ── */}
      {!hasPaymentActivity ? (
        <Card className="border-dashed bg-surface/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <DollarSign className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-starlight">Start accepting USDC payments</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-silver">
              Create a payment link, share it with a customer, and Pay On Arc handles the rest — confirmation, locking, and analytics.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild><Link href="/app/payments"><Plus className="h-4 w-4" aria-hidden="true" />Create Payment Link</Link></Button>
              <Button asChild variant="outline"><Link href="/app/connected">Setup guide</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Onboarding (only when no data) ── */}
      {!hasPaymentActivity && completedOnboarding < onboardingItems.length ? (
        <div className="rounded-2xl border border-border bg-elevated/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-starlight">Merchant setup</p>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-silver">{completedOnboarding}/{onboardingItems.length}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {onboardingItems.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-border bg-surface p-3 transition hover:border-primary/30">
                <div className={`mb-2 h-2 w-2 rounded-full ${item.complete ? "bg-success" : "bg-slate-600"}`} />
                <p className="text-sm font-medium text-starlight">{item.label}</p>
                <p className="mt-0.5 text-xs text-silver">{item.complete ? "Done" : "Next step"}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Revenue Focus + Alerts ── */}
      {hasPaymentActivity ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">Total revenue</p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-starlight">{formatCurrency(stats.totalRevenue)}</p>
              <div className="mt-2 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-success">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  {stats.growth.revenue7dLabel.replace(/[+-]/, "")} vs last 7 days
                </span>
                <span className="text-sm text-silver">{stats.successfulPayments} successful payments</span>
              </div>
            </div>
            <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs text-silver">
              {[7, 30, 90].map((range) => (
                <Link
                  key={range}
                  className={`rounded-md px-3 py-1.5 ${period === range ? "bg-primary text-white" : "hover:text-starlight"}`}
                  href={`/app/dashboard?period=${range}`}
                >{range}D</Link>
              ))}
            </div>
          </div>

          {/* ── Alerts (near top) ── */}
          {hasAlerts ? (
            <div className="space-y-2">
              {stats.failedPayments > 0 ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {stats.failedPayments} failed payment{stats.failedPayments > 1 ? "s" : ""}
                </div>
              ) : null}
              {stats.pendingPayments > 0 ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-warning/20 bg-warning/10 px-4 py-2.5 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {stats.pendingPayments} pending payment{stats.pendingPayments > 1 ? "s" : ""} need attention
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ── 4 Primary Metrics ── */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {[
              { label: "Revenue (7d)", value: formatCurrency(stats.revenue7d), icon: DollarSign },
              { label: "Successful payments", value: String(stats.successfulPayments), icon: CheckCircle2 },
              { label: "Active links", value: String(stats.activePaymentLinks), icon: Link2 },
              { label: "Pending / Failed", value: `${stats.pendingPayments + stats.failedPayments}`, icon: AlertTriangle, highlight: hasAlerts },
            ].map((m) => (
              <div key={m.label} className="bg-surface p-4">
                <div className="flex items-center gap-2">
                  <m.icon className={`h-3.5 w-3.5 ${m.highlight ? "text-warning" : "text-primary"}`} aria-hidden="true" />
                  <p className="text-[11px] text-silver">{m.label}</p>
                </div>
                <p className={`mt-1.5 text-xl font-bold tracking-tight ${m.highlight ? "text-warning" : "text-starlight"}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Charts (real RevenueChartLoader) ── */}
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-elevated/60 p-5">
              <p className="text-sm font-semibold text-starlight">Revenue over time</p>
              <p className="text-xs text-silver">{period}d volume</p>
              <div className="mt-4">
                <RevenueChartLoader data={chartData} series="revenue" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-elevated/60 p-5">
              <p className="text-sm font-semibold text-starlight">Transaction volume</p>
              <p className="text-xs text-silver">{period}d count</p>
              <div className="mt-4">
                <RevenueChartLoader data={chartData} series="transactions" />
              </div>
            </div>
          </div>

          {/* ── Activity + Quick Actions ── */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-elevated/60 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-starlight">Activity</p>
                {recentTransactions.length > 0 ? (
                  <Link href="/app/transactions" className="text-xs text-primary hover:underline">View all</Link>
                ) : null}
              </div>
              <div className="mt-4 space-y-2">
                {recentTransactions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 bg-[#0B0F19]/40 p-6 text-center text-sm text-silver">
                    Activity appears here after customer payment attempts.
                  </div>
                ) : (
                  recentTransactions.slice(0, 4).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:border-primary/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${
                          tx.status === "CONFIRMED" ? "bg-success" :
                          tx.status === "PENDING" ? "bg-warning" : "bg-danger"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-starlight truncate">{tx.paymentLink?.title ?? "Payment activity"}</p>
                          <p className="text-xs text-silver truncate">{Number(tx.amount.toFixed(6)).toFixed(2)} {tx.currency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-silver">{tx.createdAt.toLocaleDateString()}</span>
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-elevated/60 p-5">
                <p className="text-sm font-semibold text-starlight">Quick actions</p>
                <div className="mt-3 space-y-1.5">
                  {[
                    { href: "/app/payments", label: "Create Payment Link", icon: CreditCard },
                    { href: "/app/transactions", label: "View Transactions", icon: Receipt },
                    { href: "/app/webhooks", label: "Webhooks", icon: Webhook },
                    { href: "/app/settings", label: "API Keys", icon: Key },
                  ].map((a) => (
                    <Link key={a.label} href={a.href} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 text-sm text-starlight transition hover:bg-elevated">
                      <span className="flex items-center gap-2.5">
                        <a.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        {a.label}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-silver" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Top link */}
              {latestTopLink ? (
                <div className="rounded-2xl border border-border bg-elevated/60 p-5">
                  <p className="text-sm font-semibold text-starlight">Top link</p>
                  <div className="mt-3 rounded-lg border border-border bg-surface p-3">
                    <p className="font-medium text-starlight">{latestTopLink.title}</p>
                    <p className="mt-1 text-xs text-silver">{formatCurrency(latestTopLink.revenue)} · {latestTopLink.paymentsCount} payments</p>
                    <div className="mt-2"><StatusBadge status={latestTopLink.status} /></div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Merchant Profile ── */}
          <div className="rounded-2xl border border-border bg-elevated/60 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
                  {auth.user.logoUrl ? (
                    <div aria-label={`${merchantName} logo`} className="h-10 w-10 rounded-lg bg-cover bg-center" role="img" style={{ backgroundImage: `url("${auth.user.logoUrl}")` }} />
                  ) : (
                    <BrandLogo alt="Merchant" size="sm" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-starlight">{merchantName}</p>
                  <p className="font-mono text-xs text-silver">{shortAddress(merchantWallet)}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm"><Link href="/app/settings"><Globe className="h-4 w-4" aria-hidden="true" />Edit profile</Link></Button>
            </div>
          </div>

          {/* ── Insights ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-silver">Best link</p>
              <p className="mt-1.5 font-semibold text-starlight">{latestTopLink?.title ?? "No paid links yet"}</p>
              <p className="mt-1 text-xs text-silver">{latestTopLink ? `${formatCurrency(latestTopLink.revenue)} received` : "Share a link to start collecting."}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-silver">Revenue trend</p>
              <p className="mt-1.5 font-semibold text-starlight">{stats.growth.revenue7dLabel}</p>
              <p className="mt-1 text-xs text-silver">Compared with the previous 7 day period.</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-silver">Next action</p>
              <p className="mt-1.5 font-semibold text-starlight">
                {stats.activePaymentLinks > 0 ? "Share your active links" : "Create a payment link"}
              </p>
              <p className="mt-1 text-xs text-silver">
                {stats.activePaymentLinks > 0 ? "More distribution improves checkout conversion." : "Start with one simple USDC checkout request."}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}