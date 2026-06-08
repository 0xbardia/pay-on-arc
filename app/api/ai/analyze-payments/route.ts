import { NextResponse } from "next/server";
import { AiRequestType, PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const defaultModel = "openai/gpt-4o-mini";
const oneHourMs = 60 * 60 * 1000;

function isAiEnabled() {
  return process.env.AI_COPILOT_ENABLED === "true" && Boolean(process.env.OPENROUTER_API_KEY);
}

function estimateTokens(value: string) {
  return Math.ceil(value.length / 4);
}

async function callOpenRouter(prompt: string, model: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://payonarc.xyz",
      "X-Title": "Pay On Arc",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You analyze Pay On Arc payment activity only. Do not provide investment advice. Keep output concise and operational.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "OpenRouter request failed.");
  }

  return {
    summary: payload?.choices?.[0]?.message?.content?.trim() || "No AI summary returned.",
    promptTokens: payload?.usage?.prompt_tokens,
    outputTokens: payload?.usage?.completion_tokens,
  };
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "ai:analyze", 20, 60_000);

  if (limited) {
    return limited;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isAiEnabled()) {
    return NextResponse.json(
      { error: "AI_COPILOT_DISABLED", message: "AI Copilot is not enabled or OpenRouter is not configured." },
      { status: 503 },
    );
  }

  const recentRequestCount = await prisma.aiRequestLog.count({
    where: {
      userId: auth.user.id,
      type: AiRequestType.PAYMENT_INSIGHT,
      createdAt: {
        gte: new Date(Date.now() - oneHourMs),
      },
    },
  });

  if (recentRequestCount >= 5) {
    return NextResponse.json(
      { error: "AI_RATE_LIMITED", message: "AI Copilot is limited to 5 analyses per hour." },
      { status: 429 },
    );
  }

  const [paymentLinks, transactions, stats] = await Promise.all([
    prisma.paymentLink.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: { userId: auth.user.id },
      include: { paymentLink: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId: auth.user.id,
          status: { in: [TransactionStatus.PENDING, TransactionStatus.CONFIRMED, TransactionStatus.SIMULATED] },
        },
        _sum: { amount: true },
      }),
      prisma.paymentLink.count({ where: { userId: auth.user.id, status: PaymentLinkStatus.ACTIVE } }),
      prisma.paymentLink.count({ where: { userId: auth.user.id, status: PaymentLinkStatus.PAID } }),
      prisma.transaction.count({ where: { userId: auth.user.id, status: TransactionStatus.PENDING } }),
      prisma.transaction.count({ where: { userId: auth.user.id, status: TransactionStatus.CONFIRMED } }),
    ]),
  ]);
  const [volume, activeLinks, paidLinks, pendingTransactions, confirmedTransactions] = stats;
  const model = process.env.OPENROUTER_MODEL || defaultModel;
  const compactSummary = {
    totals: {
      receivedUsdc: volume._sum.amount?.toFixed(6) ?? "0.000000",
      activeLinks,
      paidLinks,
      pendingTransactions,
      confirmedTransactions,
    },
    recentPaymentLinks: paymentLinks.map((link) => ({
      title: link.title,
      amount: link.amount.toFixed(6),
      currency: link.currency,
      status: link.status,
      createdAt: link.createdAt.toISOString(),
    })),
    recentTransactions: transactions.map((transaction) => ({
      amount: transaction.amount.toFixed(6),
      currency: transaction.currency,
      status: transaction.status,
      paymentLinkTitle: transaction.paymentLink?.title ?? "Direct payment",
      payerAddress: transaction.payerAddress
        ? `${transaction.payerAddress.slice(0, 8)}...${transaction.payerAddress.slice(-6)}`
        : null,
      createdAt: transaction.createdAt.toISOString(),
    })),
  };
  const prompt = [
    "Analyze this Pay On Arc merchant payment activity.",
    "Return four short sections: Revenue summary, Pending risks, Paid link summary, Suggested next action.",
    "Do not give financial investment advice.",
    JSON.stringify(compactSummary),
  ].join("\n\n");

  try {
    const result = await callOpenRouter(prompt, model);
    const log = await prisma.aiRequestLog.create({
      data: {
        userId: auth.user.id,
        type: AiRequestType.PAYMENT_INSIGHT,
        provider: "openrouter",
        model,
        status: "success",
        promptTokens: result.promptTokens ?? estimateTokens(prompt),
        outputTokens: result.outputTokens ?? estimateTokens(result.summary),
        inputMetadata: compactSummary,
        responseSummary: result.summary,
      },
    });
    await writeAuditLog({
      walletAddress: auth.wallet.address,
      action: "AI_REQUEST",
      entityType: "AiRequestLog",
      entityId: log.id,
      metadata: {
        model,
        status: "success",
      },
    });

    return NextResponse.json({
      insight: {
        id: log.id,
        summary: result.summary,
        createdAt: log.createdAt.toISOString(),
        model,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    const log = await prisma.aiRequestLog.create({
      data: {
        userId: auth.user.id,
        type: AiRequestType.PAYMENT_INSIGHT,
        provider: "openrouter",
        model,
        status: "failed",
        promptTokens: estimateTokens(prompt),
        outputTokens: 0,
        inputMetadata: compactSummary,
        responseSummary: message,
      },
    });
    await writeAuditLog({
      walletAddress: auth.wallet.address,
      action: "AI_REQUEST",
      entityType: "AiRequestLog",
      entityId: log.id,
      metadata: {
        model,
        status: "failed",
      },
    });

    return NextResponse.json({ error: "AI_ANALYSIS_FAILED", message }, { status: 502 });
  }
}
