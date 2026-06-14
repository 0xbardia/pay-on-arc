import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { Activity, Bot, CreditCard, DollarSign, Key, Link2, Radio, Users, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/premium/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    totalWallets,
    totalPaymentLinks,
    activeLinks,
    paidLinks,
    totalTransactions,
    pendingTransactions,
    confirmedTransactions,
    failedTransactions,
    volume,
    adminAnalytics,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallet.count(),
    prisma.paymentLink.count(),
    prisma.paymentLink.count({ where: { status: PaymentLinkStatus.ACTIVE } }),
    prisma.paymentLink.count({ where: { status: PaymentLinkStatus.PAID } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: TransactionStatus.PENDING } }),
    prisma.transaction.count({ where: { status: TransactionStatus.CONFIRMED } }),
    prisma.transaction.count({ where: { status: TransactionStatus.FAILED } }),
    prisma.transaction.aggregate({
      where: {
        status: {
          in: [TransactionStatus.PENDING, TransactionStatus.CONFIRMED, TransactionStatus.SIMULATED],
        },
      },
      _sum: { amount: true },
    }),
    Promise.all(
      [
        { label: "Last 24h", since: dayAgo },
        { label: "Last 7d", since: sevenDaysAgo },
        { label: "Last 30d", since: thirtyDaysAgo },
      ].map(async (period) => {
        const [merchants, revenue, transactions, apiCalls, webhookDeliveries, aiRequests] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: period.since } } }),
          prisma.transaction.aggregate({
            where: {
              createdAt: { gte: period.since },
              status: { in: [TransactionStatus.PENDING, TransactionStatus.CONFIRMED, TransactionStatus.SIMULATED] },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({ where: { createdAt: { gte: period.since } } }),
          prisma.apiKey.count({ where: { lastUsedAt: { gte: period.since } } }),
          prisma.webhookDelivery.count({ where: { createdAt: { gte: period.since } } }),
          prisma.aiRequestLog.count({ where: { createdAt: { gte: period.since } } }),
        ]);

        return {
          label: period.label,
          merchants,
          revenue: Number(revenue._sum.amount?.toFixed(6) ?? 0),
          transactions,
          apiCalls,
          webhookDeliveries,
          aiRequests,
        };
      }),
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Platform-wide overview for Pay On Arc users, payment links, and Arc Testnet USDC activity.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Users" numericValue={totalUsers} description="Registered wallet users." icon={Users} />
        <MetricCard title="Wallets" numericValue={totalWallets} description="Connected EVM wallets." icon={WalletCards} />
        <MetricCard title="Payment links" numericValue={totalPaymentLinks} description="All merchant links." icon={Link2} />
        <MetricCard title="Active links" numericValue={activeLinks} description="Open links." icon={Activity} />
        <MetricCard title="Paid links" numericValue={paidLinks} description="Completed links." icon={CreditCard} />
        <MetricCard title="Transactions" numericValue={totalTransactions} description="All payment attempts." icon={WalletCards} />
        <MetricCard title="Pending" numericValue={pendingTransactions} description="Awaiting receipt." icon={Activity} />
        <MetricCard title="Confirmed" numericValue={confirmedTransactions} description="Successful receipts." icon={CreditCard} />
        <MetricCard title="Failed" numericValue={failedTransactions} description="Failed receipt checks." icon={Activity} />
        <MetricCard
          title="USDC volume"
          numericValue={Number(volume._sum.amount?.toFixed(6) ?? 0)}
          prefix="$"
          description="Pending, confirmed, and simulated."
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {adminAnalytics.map((period) => (
          <Card key={period.label} className="bg-elevated/60">
            <CardHeader>
              <CardTitle>{period.label}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 text-slate-400"><Users className="h-4 w-4" />Merchants</span>
                <span className="font-semibold text-white">{period.merchants}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 text-slate-400"><DollarSign className="h-4 w-4" />Revenue</span>
                <span className="font-semibold text-white">${period.revenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 text-slate-400"><WalletCards className="h-4 w-4" />Transactions</span>
                <span className="font-semibold text-white">{period.transactions}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 text-slate-400"><Key className="h-4 w-4" />API Calls</span>
                <span className="font-semibold text-white">{period.apiCalls}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 text-slate-400"><Radio className="h-4 w-4" />Webhook Deliveries</span>
                <span className="font-semibold text-white">{period.webhookDeliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400"><Bot className="h-4 w-4" />AI Requests</span>
                <span className="font-semibold text-white">{period.aiRequests}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
