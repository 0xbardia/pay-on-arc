import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AnalyticsPeriod = 7 | 30 | 90;

const successfulStatuses = [TransactionStatus.CONFIRMED, TransactionStatus.SIMULATED];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toNumber(value?: { toFixed: (digits: number) => string } | null) {
  return Number(value?.toFixed(6) ?? 0);
}

function growthPercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function formatGrowth(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function parseAnalyticsPeriod(value?: string | null): AnalyticsPeriod {
  const period = Number(value);

  return period === 90 || period === 30 || period === 7 ? period : 30;
}

export async function getDashboardStats(userId: string) {
  const sevenDaysAgo = daysAgo(7);
  const fourteenDaysAgo = daysAgo(14);
  const thirtyDaysAgo = daysAgo(30);
  const sixtyDaysAgo = daysAgo(60);

  const [
    totalRevenue,
    revenue7d,
    revenuePrevious7d,
    revenue30d,
    revenuePrevious30d,
    totalTransactions,
    successfulPayments,
    failedPayments,
    activePaymentLinks,
    paidLinks,
    pendingPayments,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, status: { in: successfulStatuses } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, status: { in: successfulStatuses }, createdAt: { gte: sevenDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        status: { in: successfulStatuses },
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, status: { in: successfulStatuses }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        status: { in: successfulStatuses },
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId, status: { in: successfulStatuses } } }),
    prisma.transaction.count({ where: { userId, status: TransactionStatus.FAILED } }),
    prisma.paymentLink.count({ where: { userId, status: PaymentLinkStatus.ACTIVE } }),
    prisma.paymentLink.count({ where: { userId, status: PaymentLinkStatus.PAID } }),
    prisma.transaction.count({ where: { userId, status: TransactionStatus.PENDING } }),
  ]);

  const totalRevenueValue = toNumber(totalRevenue._sum.amount);
  const revenue7dValue = toNumber(revenue7d._sum.amount);
  const revenuePrevious7dValue = toNumber(revenuePrevious7d._sum.amount);
  const revenue30dValue = toNumber(revenue30d._sum.amount);
  const revenuePrevious30dValue = toNumber(revenuePrevious30d._sum.amount);
  const averagePaymentSize = successfulPayments > 0 ? totalRevenueValue / successfulPayments : 0;
  const successRate =
    successfulPayments + failedPayments > 0
      ? (successfulPayments / (successfulPayments + failedPayments)) * 100
      : 0;

  return {
    totalRevenue: totalRevenueValue,
    revenue7d: revenue7dValue,
    revenue30d: revenue30dValue,
    totalTransactions,
    successfulPayments,
    failedPayments,
    activePaymentLinks,
    paidLinks,
    pendingPayments,
    averagePaymentSize,
    successRate,
    growth: {
      revenue7d: growthPercent(revenue7dValue, revenuePrevious7dValue),
      revenue30d: growthPercent(revenue30dValue, revenuePrevious30dValue),
      revenue7dLabel: formatGrowth(growthPercent(revenue7dValue, revenuePrevious7dValue)),
      revenue30dLabel: formatGrowth(growthPercent(revenue30dValue, revenuePrevious30dValue)),
    },
  };
}

export async function getRevenueSeries(userId: string, period: AnalyticsPeriod) {
  const start = daysAgo(period - 1);
  start.setHours(0, 0, 0, 0);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      status: { in: successfulStatuses },
      createdAt: { gte: start },
    },
    orderBy: { createdAt: "asc" },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  const buckets = new Map<string, { date: string; label: string; revenue: number; transactions: number }>();

  for (let index = period - 1; index >= 0; index -= 1) {
    const date = daysAgo(index);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().slice(0, 10);
    buckets.set(dateKey, {
      date: dateKey,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      revenue: 0,
      transactions: 0,
    });
  }

  for (const transaction of transactions) {
    const dateKey = transaction.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(dateKey);

    if (!bucket) {
      continue;
    }

    bucket.revenue += toNumber(transaction.amount);
    bucket.transactions += 1;
  }

  return Array.from(buckets.values());
}

export async function getTopPaymentLinks(userId: string, limit = 5) {
  const grouped = await prisma.transaction.groupBy({
    by: ["paymentLinkId"],
    where: {
      userId,
      paymentLinkId: { not: null },
      status: { in: successfulStatuses },
    },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
    take: limit,
  });

  const ids = grouped
    .map((item) => item.paymentLinkId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    return [];
  }

  const links = await prisma.paymentLink.findMany({
    where: { id: { in: ids }, userId },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });
  const linkById = new Map(links.map((link) => [link.id, link]));

  return grouped.flatMap((item) => {
    if (!item.paymentLinkId) {
      return [];
    }

    const link = linkById.get(item.paymentLinkId);

    if (!link) {
      return [];
    }

    return {
      id: link.id,
      title: link.title,
      status: link.status,
      revenue: toNumber(item._sum.amount),
      paymentsCount: item._count._all,
    };
  });
}

export async function getRecentTransactions(userId: string, take = 6) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { paymentLink: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}
