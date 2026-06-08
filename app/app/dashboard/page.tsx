import Link from "next/link";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { AlertTriangle, Bot, CheckCircle2, CreditCard, DollarSign, Link2, Plus, Receipt, Timer, WalletCards } from "lucide-react";
import { cache } from "react";
import { MetricCard } from "@/components/premium/metric-card";
import { RevenueChartLoader } from "@/components/premium/revenue-chart-loader";
import { StatusBadge } from "@/components/premium/status-badge";
import { TimelineItem } from "@/components/premium/timeline-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { demoDashboard, isDemoDataEnabled } from "@/lib/demo-data";
import { logDevRequest } from "@/lib/dev-log";
import { getMerchantDisplayName } from "@/lib/merchant-profile";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getDashboardData = cache(async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const paidStatuses = [TransactionStatus.SIMULATED, TransactionStatus.PENDING, TransactionStatus.CONFIRMED];

  return Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        status: { in: paidStatuses },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, status: { in: paidStatuses }, createdAt: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, status: { in: paidStatuses }, createdAt: { gte: sevenDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, status: { in: paidStatuses }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.paymentLink.count({ where: { userId, status: PaymentLinkStatus.ACTIVE } }),
    prisma.paymentLink.count({ where: { userId, status: PaymentLinkStatus.PAID } }),
    prisma.paymentLink.count({ where: { userId, status: PaymentLinkStatus.EXPIRED } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId, status: TransactionStatus.PENDING } }),
    prisma.transaction.count({ where: { userId, status: TransactionStatus.CONFIRMED } }),
    prisma.transaction.count({ where: { userId, status: TransactionStatus.FAILED } }),
    prisma.transaction.findMany({
      where: { userId },
      include: { paymentLink: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: paidStatuses },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);
});

function buildChartData(transactions: Array<{ createdAt: Date; amount: { toFixed: (digits: number) => string } }>) {
  const buckets = new Map<string, { revenue: number; transactions: number }>();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
    buckets.set(date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), { revenue: 0, transactions: 0 });
  }

  for (const transaction of transactions) {
    const label = transaction.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    if (buckets.has(label)) {
      const bucket = buckets.get(label) ?? { revenue: 0, transactions: 0 };
      buckets.set(label, {
        revenue: bucket.revenue + Number(transaction.amount.toFixed(6)),
        transactions: bucket.transactions + 1,
      });
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, ...value }));
}

export default async function DashboardPage() {
  logDevRequest("GET /app/dashboard");
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return null;
  }

  const [
    totalVolume,
    todayVolume,
    sevenDayVolume,
    thirtyDayVolume,
    activeLinks,
    paidLinks,
    expiredLinks,
    transactionCount,
    pendingTransactions,
    confirmedTransactions,
    failedTransactions,
    recentTransactions,
    chartTransactions,
  ] =
    await getDashboardData(auth.user.id);
  const totalRevenue = Number(totalVolume._sum.amount?.toFixed(6) ?? 0);
  const revenueToday = Number(todayVolume._sum.amount?.toFixed(6) ?? 0);
  const revenue7d = Number(sevenDayVolume._sum.amount?.toFixed(6) ?? 0);
  const revenue30d = Number(thirtyDayVolume._sum.amount?.toFixed(6) ?? 0);
  const successRate =
    confirmedTransactions + failedTransactions > 0
      ? (confirmedTransactions / (confirmedTransactions + failedTransactions)) * 100
      : 0;
  const showDemoData = isDemoDataEnabled && transactionCount === 0;
  const displayRevenue = showDemoData ? demoDashboard.revenue : totalRevenue;
  const displayTransactions = showDemoData ? demoDashboard.transactions : transactionCount;
  const displayPaidLinks = showDemoData ? demoDashboard.paidLinks : paidLinks;
  const displayPending = showDemoData ? demoDashboard.pending : pendingTransactions;
  const chartData = showDemoData ? demoDashboard.chart : buildChartData(chartTransactions);
  const merchantName = auth.user.merchantName ? getMerchantDisplayName(auth.user) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Merchant</p>
          <h1 className="mt-3 text-3xl font-bold text-white">{merchantName ?? "Dashboard"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {merchantName
              ? "Your Pay On Arc merchant dashboard for revenue, payment links, and Arc Testnet USDC activity."
              : "Revenue, payment links, and Arc Testnet USDC activity in one operating view."}
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
            <Link href="/app/ai">
              <Bot className="h-4 w-4" aria-hidden="true" />
              AI Copilot
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Revenue" numericValue={displayRevenue} prefix="$" description="Total received volume" trend="+12%" icon={DollarSign} />
        <MetricCard title="Revenue Today" numericValue={revenueToday} prefix="$" description="Volume since midnight" icon={DollarSign} />
        <MetricCard title="Revenue 7d" numericValue={revenue7d} prefix="$" description="Rolling 7 day volume" icon={DollarSign} />
        <MetricCard title="Revenue 30d" numericValue={revenue30d} prefix="$" description="Rolling 30 day volume" icon={DollarSign} />
        <MetricCard title="Transactions" numericValue={displayTransactions} description="All payment attempts" trend="+7%" icon={WalletCards} />
        <MetricCard title="Success Rate" numericValue={successRate} suffix="%" description="Confirmed vs failed" icon={CheckCircle2} />
        <MetricCard title="Failed Transactions" numericValue={failedTransactions} description="Receipt failures" icon={AlertTriangle} />
        <MetricCard title="Paid Links" numericValue={displayPaidLinks} description="Completed payment links" trend="+9%" icon={Link2} />
        <MetricCard title="Active Links" numericValue={activeLinks} description="Open payment requests" icon={Link2} />
        <MetricCard title="Expired Links" numericValue={expiredLinks} description="Closed by expiry" icon={Timer} />
        <MetricCard title="Pending Payments" numericValue={displayPending} description="Awaiting receipt checks" trend="auto-check" icon={Timer} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-elevated/60">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>7 day payment volume</CardDescription>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs text-slate-400">
              {["7D", "30D", "90D"].map((range) => (
                <span key={range} className={`rounded-md px-3 py-1.5 ${range === "7D" ? "bg-primary text-white" : ""}`}>
                  {range}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChartLoader data={chartData} />
          </CardContent>
        </Card>

        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Transactions Over Time</CardTitle>
            <CardDescription>7 day payment attempt count</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChartLoader data={chartData} series="transactions" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.65fr_1.35fr]">
        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common merchant workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: "/app/payments", label: "Create Payment Link", icon: CreditCard },
              { href: "/app/transactions", label: "View Transactions", icon: Receipt },
              { href: "/app/ai", label: "Open AI Copilot", icon: Bot },
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
      </div>

      <Card className="bg-elevated/60">
        <CardHeader>
          <CardTitle>Activity feed</CardTitle>
          <CardDescription>Latest payment events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            showDemoData ? (
              <div className="space-y-3">
                {demoDashboard.activity.map((item) => (
                  <div key={item.title} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <TimelineItem icon={Receipt} title={item.title} description={item.description} meta="Demo activity" />
                    <StatusBadge status={item.status} className="w-fit sm:justify-self-end" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
                <h2 className="text-lg font-semibold text-white">No recent activity</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Create your first payment link and start accepting USDC. Activity appears here after customer payments.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/app/payments">Create Payment Link</Link>
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <TimelineItem
                    icon={Receipt}
                    title={transaction.paymentLink?.title ?? "Payment received"}
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
    </div>
  );
}
