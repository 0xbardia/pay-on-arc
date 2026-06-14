import Link from "next/link";
import { headers } from "next/headers";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ExternalLink,
  Globe,
  Key,
  Link2,
  Plus,
  Receipt,
  Timer,
  TrendingUp,
  WalletCards,
  Webhook,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { MetricCard } from "@/components/premium/metric-card";
import { RevenueChartLoader } from "@/components/premium/revenue-chart-loader";
import { StatusBadge } from "@/components/premium/status-badge";
import { TimelineItem } from "@/components/premium/timeline-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  searchParams: Promise<{
    period?: string;
  }>;
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

  if (!auth) {
    return null;
  }

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Today at a glance</p>
          <h1 className="mt-3 text-3xl font-bold text-white">{merchantName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Track revenue, payment link performance, checkout activity, and merchant operations from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/app/payments">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Payment Link
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/transactions">
              <Receipt className="h-4 w-4" aria-hidden="true" />
              View Transactions
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          numericValue={stats.totalRevenue}
          prefix="$"
          description="Verified successful volume"
          icon={DollarSign}
        />
        <MetricCard
          title="Revenue Last 7 Days"
          numericValue={stats.revenue7d}
          prefix="$"
          description="Compared with previous 7 days"
          trend={stats.growth.revenue7dLabel}
          icon={TrendingUp}
        />
        <MetricCard
          title="Revenue Last 30 Days"
          numericValue={stats.revenue30d}
          prefix="$"
          description="Compared with previous 30 days"
          trend={stats.growth.revenue30dLabel}
          icon={TrendingUp}
        />
        <MetricCard
          title="Average Payment Size"
          numericValue={stats.averagePaymentSize}
          prefix="$"
          description="Across successful payments"
          icon={CreditCard}
        />
        <MetricCard title="Total Transactions" numericValue={stats.totalTransactions} description="All payment attempts" icon={WalletCards} />
        <MetricCard title="Successful Payments" numericValue={stats.successfulPayments} description={`${stats.successRate.toFixed(1)}% success rate`} icon={CheckCircle2} />
        <MetricCard title="Failed Payments" numericValue={stats.failedPayments} description="Rejected or reverted attempts" icon={AlertTriangle} />
        <MetricCard title="Active Payment Links" numericValue={stats.activePaymentLinks} description="Open checkout requests" icon={Link2} />
      </div>

      {!hasPaymentActivity ? (
        <Card className="border-dashed bg-elevated/50">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">No payments yet</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Create your first payment link and share it with a customer. Revenue, trends, and top links will appear after payment activity.
              </p>
            </div>
            <Button asChild>
              <Link href="/app/payments">Create Payment Link</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-elevated/60">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Revenue over time</CardTitle>
              <CardDescription>{period} day successful payment volume</CardDescription>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs text-slate-400">
              {[7, 30, 90].map((range) => (
                <Link
                  key={range}
                  className={`rounded-md px-3 py-1.5 ${period === range ? "bg-primary text-white" : "hover:text-white"}`}
                  href={`/app/dashboard?period=${range}`}
                >
                  {range}D
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChartLoader data={chartData} />
          </CardContent>
        </Card>

        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Transaction volume</CardTitle>
            <CardDescription>{period} day successful payment count</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChartLoader data={chartData} series="transactions" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common merchant workflows</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { href: "/app/payments", label: "Create Payment Link", icon: CreditCard },
              { href: "/app/transactions", label: "View Transactions", icon: Receipt },
              { href: "/app/webhooks", label: "Manage Webhooks", icon: Webhook },
              { href: "/app/settings", label: "Generate API Key", icon: Key },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-white transition hover:border-violet-400/30 hover:bg-white/[0.06]"
              >
                <span className="flex items-center gap-3">
                  <action.icon className="h-4 w-4 text-violet-300" aria-hidden="true" />
                  {action.label}
                </span>
                <span className="text-slate-500">→</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Top Performing Payment Links</CardTitle>
            <CardDescription>Sorted by successful payment revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topLinks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
                <h2 className="text-lg font-semibold text-white">No top links yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Your highest-revenue payment links will appear after customers pay.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topLinks.map((link) => (
                  <div
                    key={link.id}
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{link.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{link.paymentsCount} successful payments</p>
                    </div>
                    <p className="font-semibold text-white">{formatCurrency(link.revenue)}</p>
                    <StatusBadge status={link.status} className="w-fit" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>Latest payment events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
                <h2 className="text-lg font-semibold text-white">No recent activity</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Activity appears here after customer payment attempts.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <TimelineItem
                      icon={Receipt}
                      title={transaction.paymentLink?.title ?? "Payment activity"}
                      description={`${transaction.payerAddress ?? "Unknown payer"} · ${Number(transaction.amount.toFixed(6)).toFixed(2)} ${transaction.currency}`}
                      meta={transaction.createdAt.toLocaleString()}
                    />
                    <StatusBadge status={transaction.status} className="w-fit sm:justify-self-end" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Merchant Branding Preview</CardTitle>
            <CardDescription>How customers recognize your checkout experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19] p-5">
              <div className="flex items-center gap-3">
                {auth.user.logoUrl ? (
                  <div
                    aria-label={`${merchantName} logo`}
                    className="h-12 w-12 rounded-xl border border-white/10 bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url("${auth.user.logoUrl}")` }}
                  />
                ) : (
                  <BrandLogo alt="Pay On Arc merchant" size="lg" />
                )}
                <div>
                  <p className="font-semibold text-white">{merchantName}</p>
                  <p className="font-mono text-xs text-slate-400">{shortAddress(merchantWallet)}</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
                <p className="text-sm text-violet-200">Checkout identity</p>
                <p className="mt-2 text-2xl font-bold text-white">{latestTopLink ? formatCurrency(latestTopLink.revenue) : "$0.00"}</p>
                <p className="mt-1 text-sm text-slate-400">USDC on Arc Testnet</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-400">
                {auth.user.websiteUrl ? (
                  <Link className="inline-flex items-center gap-2 text-slate-300 underline" href={auth.user.websiteUrl} target="_blank">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                    Website
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <p>Add a website URL in Settings to strengthen checkout trust.</p>
                )}
                <p>Social links can be added as future profile channels.</p>
              </div>
              <Button asChild className="mt-5 w-full" variant="outline">
                <Link href="/app/settings">Edit Merchant Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-elevated/60">
        <CardHeader>
          <CardTitle>Merchant insights</CardTitle>
          <CardDescription>Operational signals based on current payment activity</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">Best performing link</p>
            <p className="mt-2 font-semibold text-white">{latestTopLink?.title ?? "No paid links yet"}</p>
            <p className="mt-1 text-sm text-slate-500">{latestTopLink ? `${formatCurrency(latestTopLink.revenue)} received` : "Share a payment link to start collecting data."}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">Revenue trend</p>
            <p className="mt-2 font-semibold text-white">{stats.growth.revenue7dLabel} over 7 days</p>
            <p className="mt-1 text-sm text-slate-500">Compared with the previous 7 day period.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">Next action</p>
            <p className="mt-2 font-semibold text-white">
              {stats.activePaymentLinks > 0 ? "Share your active links" : "Create a payment link"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {stats.activePaymentLinks > 0
                ? "More distribution improves checkout conversion data."
                : "Start with one simple USDC checkout request."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
