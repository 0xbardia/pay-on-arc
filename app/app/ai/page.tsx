import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { Bot, CheckCircle2, Clock, CreditCard, DollarSign, Link2, Sparkles } from "lucide-react";
import { AiAnalyzePaymentsButton } from "@/components/ai-analyze-payments-button";
import { MetricCard } from "@/components/premium/metric-card";
import { StructuredInsight } from "@/components/premium/structured-insight";
import { TimelineItem } from "@/components/premium/timeline-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cleanSummary(summary?: string | null) {
  return (summary ?? "Insight generated")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*]\s*/gm, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function relativeDay(date: Date) {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default async function AiPage() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return null;
  }

  const [totalReceived, activeLinks, paidLinks, pendingTransactions, confirmedTransactions, latestInsight, previousInsights] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId: auth.user.id,
          status: {
            in: [TransactionStatus.PENDING, TransactionStatus.CONFIRMED, TransactionStatus.SIMULATED],
          },
        },
        _sum: { amount: true },
      }),
      prisma.paymentLink.count({ where: { userId: auth.user.id, status: PaymentLinkStatus.ACTIVE } }),
      prisma.paymentLink.count({ where: { userId: auth.user.id, status: PaymentLinkStatus.PAID } }),
      prisma.transaction.count({ where: { userId: auth.user.id, status: TransactionStatus.PENDING } }),
      prisma.transaction.count({ where: { userId: auth.user.id, status: TransactionStatus.CONFIRMED } }),
      prisma.aiRequestLog.findFirst({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiRequestLog.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
        skip: 1,
        take: 5,
      }),
    ]);
  const aiEnabled = process.env.AI_COPILOT_ENABLED === "true" && Boolean(process.env.OPENROUTER_API_KEY);
  const received = Number(totalReceived._sum.amount?.toFixed(6) ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Merchant</p>
        <h1 className="mt-3 text-3xl font-bold text-white">AI Copilot</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Ask Pay On Arc to summarize payment performance, identify pending risks, and recommend the next operational action.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Total received" numericValue={received} prefix="$" description="Payment volume" icon={DollarSign} />
        <MetricCard title="Active links" numericValue={activeLinks} description="Open requests" icon={Link2} />
        <MetricCard title="Paid links" numericValue={paidLinks} description="Completed links" icon={CreditCard} />
        <MetricCard title="Pending txs" numericValue={pendingTransactions} description="Need attention" icon={Clock} />
        <MetricCard title="Confirmed txs" numericValue={confirmedTransactions} description="Settled activity" icon={CheckCircle2} />
      </div>

      <Card className="overflow-hidden bg-elevated/70">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-white">Payment intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Analysis is scoped to your own payment links and transactions. It does not use secrets, private keys, or unrelated user data.
            </p>
            {!aiEnabled ? (
              <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                AI Copilot is disabled until OpenRouter is configured.
              </div>
            ) : null}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0B0F19] p-5">
            <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <p className="text-sm font-semibold text-white">Pay On Arc analyst</p>
            </div>
            <AiAnalyzePaymentsButton disabled={!aiEnabled} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Latest insight</CardTitle>
            <CardDescription>Most recent AI request for your merchant account.</CardDescription>
          </CardHeader>
          <CardContent>
          {latestInsight?.responseSummary ? (
            <StructuredInsight summary={latestInsight.responseSummary} />
          ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                Run your first analysis to generate a payment summary.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-elevated/60">
          <CardHeader>
            <CardTitle>Insight timeline</CardTitle>
            <CardDescription>Recent Copilot history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previousInsights.length === 0 ? (
              <p className="text-sm text-slate-400">No previous insights yet.</p>
            ) : (
              previousInsights.map((insight) => (
                <TimelineItem
                  key={insight.id}
                  icon={Sparkles}
                  title={relativeDay(insight.createdAt)}
                  description={cleanSummary(insight.responseSummary)}
                  meta={`${insight.model ?? "AI model"} · ${insight.status}`}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
