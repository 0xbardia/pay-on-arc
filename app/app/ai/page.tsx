import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { AlertTriangle, ArrowRight, BarChart3, Bot, CheckCircle2, Clock, DollarSign, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { AiAnalyzePaymentsButton } from "@/components/ai-analyze-payments-button";
import { StructuredInsight } from "@/components/premium/structured-insight";
import { Card, CardContent } from "@/components/ui/card";
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
  const hasData = received > 0 || activeLinks > 0;
  const hasPendingIssues = pendingTransactions > 0;

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">Merchant</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-starlight">AI Workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-silver">
            Analyze payment performance, identify pending risks, and get clear operational recommendations — generated from your merchant data.
          </p>
        </div>
      </div>

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">
        {[
          { label: "Total received", value: `$${received.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign },
          { label: "Active links", value: String(activeLinks), icon: BarChart3 },
          { label: "Paid links", value: String(paidLinks), icon: CheckCircle2 },
          { label: "Pending txs", value: String(pendingTransactions), icon: Clock, highlight: hasPendingIssues ? "warning" : undefined },
          { label: "Confirmed txs", value: String(confirmedTransactions), icon: TrendingUp },
        ].map((m) => (
          <div key={m.label} className="bg-surface p-4">
            <div className="flex items-center gap-2">
              <m.icon className={`h-3.5 w-3.5 ${m.highlight === "warning" ? "text-warning" : "text-primary"}`} aria-hidden="true" />
              <p className="text-[11px] text-silver">{m.label}</p>
            </div>
            <p className={`mt-1.5 text-xl font-bold tracking-tight ${m.highlight === "warning" ? "text-warning" : "text-starlight"}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Intelligence Panel ── */}
      {!hasData ? (
        /* Empty state — no data yet */
        <Card className="border-dashed bg-surface/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-starlight">AI Copilot needs data to analyze</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-silver">
              Create payment links, receive payments, and the AI Copilot will generate insights, revenue trends, and operational recommendations automatically.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {aiEnabled ? (
                <AiAnalyzePaymentsButton disabled={!aiEnabled} />
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 px-4 py-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  AI Copilot disabled — configure OpenRouter
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border bg-elevated/60 p-5 sm:p-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* Left: description + prompts */}
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-starlight">Payment intelligence</h2>
              <p className="mt-3 text-sm leading-6 text-silver">
                Your workspace data — payment links, revenue, pending transactions — generates a concise operating brief. No manual digging required.
              </p>

              {/* Real-time data snapshot */}
              <div className="mt-5 grid gap-2 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-silver">Current workspace</p>
                {[
                  `$${received.toLocaleString()} total received across ${activeLinks} active links`,
                  `${confirmedTransactions} confirmed transactions · ${pendingTransactions} pending`,
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-starlight">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {hasPendingIssues ? (
                <div className="mt-5 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="font-medium">{pendingTransactions} pending transaction{pendingTransactions > 1 ? "s" : ""} need attention</span>
                  </div>
                </div>
              ) : null}

              {/* Disabled warning */}
              {!aiEnabled ? (
                <div className="mt-5 rounded-lg border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                  AI Copilot is disabled until OpenRouter is configured.
                </div>
              ) : null}
            </div>

            {/* Right: analyst panel */}
            <div className="rounded-xl border border-border bg-[#0B0F19] p-5">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-success" />
                <p className="text-sm font-semibold text-starlight">Pay On Arc analyst</p>
              </div>
              <div className="mt-5 space-y-4 text-sm text-silver">
                <p>
                  Your workspace has processed <span className="font-semibold text-starlight">${received.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> across <span className="font-semibold text-starlight">{activeLinks}</span> active payment links.
                </p>
                <p>
                  {confirmedTransactions > 0
                    ? `${confirmedTransactions} confirmed transactions settled successfully.`
                    : "No confirmed transactions yet."}
                </p>
                <p>
                  {hasPendingIssues
                    ? `${pendingTransactions} pending transaction${pendingTransactions > 1 ? "s" : ""} require${pendingTransactions === 1 ? "s" : ""} follow-up with payers.`
                    : "No pending transactions. All activity is current."}
                </p>
                <p className="text-xs opacity-70">
                  Analysis scoped to this merchant workspace. Secrets, keys, and webhook secrets are excluded.
                </p>
              </div>
              <div className="mt-5">
                <AiAnalyzePaymentsButton disabled={!aiEnabled} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Insights Workspace ── */}
      {hasData ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Latest insight */}
          <div className="rounded-2xl border border-border bg-elevated/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-starlight">Latest insight</p>
              {latestInsight?.responseSummary ? (
                <span className="text-xs text-silver">{latestInsight.model ?? "AI"} · {latestInsight.status}</span>
              ) : null}
            </div>
            <div className="mt-4">
              {latestInsight?.responseSummary ? (
                <StructuredInsight summary={latestInsight.responseSummary} />
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-[#0B0F19]/40 p-8 text-center text-sm text-silver">
                  <Sparkles className="mx-auto h-8 w-8 text-silver/50" aria-hidden="true" />
                  <p className="mt-3 font-medium text-starlight">Run your first analysis</p>
                  <p className="mt-1">Click &quot;Analyze&quot; to generate a payment summary.</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-elevated/60 p-5">
            <p className="text-sm font-semibold text-starlight">Previous analyses</p>
            <div className="mt-4 space-y-2">
              {previousInsights.length === 0 ? (
                <p className="text-sm text-silver">No previous analyses yet.</p>
              ) : (
                previousInsights.map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-starlight">{relativeDay(insight.createdAt)}</p>
                      <p className="mt-0.5 text-xs leading-5 text-silver">{cleanSummary(insight.responseSummary)}</p>
                      <p className="mt-1 text-[11px] text-silver/60">{insight.model ?? "AI model"} · {insight.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}