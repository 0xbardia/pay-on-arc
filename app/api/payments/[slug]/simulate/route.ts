import { NextResponse } from "next/server";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { isAddress } from "viem";
import { isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type SimulatePaymentBody = {
  payerAddress?: string;
};

type SimulatePaymentConflict = {
  code: string;
  message: string;
  status: number;
};

function paymentError(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status });
}

function createConflict(code: string, message: string, status: number): SimulatePaymentConflict {
  return { code, message, status };
}

function isSimulatePaymentConflict(error: unknown): error is SimulatePaymentConflict {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "status" in error
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = (await request.json().catch(() => null)) as SimulatePaymentBody | null;
  const payerAddress = body?.payerAddress?.toLowerCase();

  if (!payerAddress || !isAddress(payerAddress)) {
    return paymentError("PAYER_WALLET_REQUIRED", "A connected payer wallet is required.", 400);
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const paymentLink = await tx.paymentLink.findUnique({
        where: { slug },
        include: {
          user: {
            include: {
              wallets: {
                orderBy: { lastConnectedAt: "desc" },
                take: 1,
              },
            },
          },
          transactions: {
            where: {
              status: {
                in: [
                  TransactionStatus.PENDING,
                  TransactionStatus.CONFIRMED,
                  TransactionStatus.SIMULATED,
                ],
              },
            },
            take: 1,
          },
        },
      });

      if (!paymentLink) {
        throw createConflict("PAYMENT_LINK_NOT_FOUND", "Payment link not found.", 404);
      }

      if (paymentLink.status === PaymentLinkStatus.PAID) {
        throw createConflict(
          "PAYMENT_LINK_ALREADY_PAID",
          "This payment link has already been paid.",
          409,
        );
      }

      if (paymentLink.status !== PaymentLinkStatus.ACTIVE || isPaymentLinkExpired(paymentLink.expiresAt)) {
        throw createConflict("PAYMENT_LINK_UNAVAILABLE", "Payment link is not available.", 400);
      }

      if (paymentLink.transactions.length > 0) {
        throw createConflict(
          "PAYMENT_ALREADY_EXISTS",
          "This payment link already has a payment attempt.",
          409,
        );
      }

      const linkUpdate = await tx.paymentLink.updateMany({
        where: {
          id: paymentLink.id,
          status: PaymentLinkStatus.ACTIVE,
        },
        data: { status: PaymentLinkStatus.PAID },
      });

      if (linkUpdate.count !== 1) {
        throw createConflict(
          "PAYMENT_ALREADY_EXISTS",
          "This payment link is no longer available.",
          409,
        );
      }

      const transaction = await tx.transaction.create({
        data: {
          userId: paymentLink.userId,
          paymentLinkId: paymentLink.id,
          payerAddress,
          recipientAddress: paymentLink.user.wallets[0]?.address ?? null,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          status: TransactionStatus.SIMULATED,
          metadata: {
            phase: "phase-3",
            mode: "simulated",
            note: "No blockchain transfer was executed.",
          },
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            walletAddress: payerAddress,
            action: "TRANSACTION_CREATED",
            entityType: "Transaction",
            entityId: transaction.id,
            metadata: {
              paymentLinkId: paymentLink.id,
              mode: "simulated",
            },
          },
          {
            walletAddress: paymentLink.user.wallets[0]?.address?.toLowerCase() ?? null,
            action: "PAYMENT_LINK_PAID",
            entityType: "PaymentLink",
            entityId: paymentLink.id,
            metadata: {
              transactionId: transaction.id,
              mode: "simulated",
            },
          },
        ],
      });

      return transaction;
    });

    void emitWebhookEvent({
      userId: transaction.userId,
      type: "payment.created",
      data: {
        id: transaction.id,
        paymentLinkId: transaction.paymentLinkId,
        amount: transaction.amount.toFixed(6),
        currency: transaction.currency,
        payerAddress: transaction.payerAddress,
        recipientAddress: transaction.recipientAddress,
        status: transaction.status,
        mode: "simulated",
        createdAt: transaction.createdAt.toISOString(),
      },
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[webhooks] payment.created emit failed", error);
      }
    });

    return NextResponse.json(
      {
        transaction: {
          id: transaction.id,
          amount: transaction.amount.toFixed(6),
          currency: transaction.currency,
          payerAddress: transaction.payerAddress,
          recipientAddress: transaction.recipientAddress,
          status: transaction.status,
          createdAt: transaction.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isSimulatePaymentConflict(error)) {
      return paymentError(error.code, error.message, error.status);
    }

    throw error;
  }
}
