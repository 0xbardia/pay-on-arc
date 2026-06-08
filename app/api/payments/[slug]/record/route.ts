import { NextResponse } from "next/server";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { isAddress, isHash } from "viem";
import { arcChainId } from "@/lib/arc-config";
import { isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type RecordPaymentBody = {
  payerAddress?: string;
  txHash?: string;
  chainId?: number;
};

type PaymentRecordConflict = {
  code: string;
  message: string;
  status: number;
};

function paymentError(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status });
}

function createConflict(code: string, message: string, status: number): PaymentRecordConflict {
  return { code, message, status };
}

function isPaymentRecordConflict(error: unknown): error is PaymentRecordConflict {
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
  const body = (await request.json().catch(() => null)) as RecordPaymentBody | null;
  const payerAddress = body?.payerAddress?.toLowerCase();
  const txHash = body?.txHash?.toLowerCase();

  if (!payerAddress || !isAddress(payerAddress)) {
    return paymentError("PAYER_WALLET_REQUIRED", "A connected payer wallet is required.", 400);
  }

  if (!txHash || !isHash(txHash)) {
    return paymentError("INVALID_TX_HASH", "A valid transaction hash is required.", 400);
  }

  if (body?.chainId !== arcChainId) {
    return paymentError("INVALID_CHAIN", "Payment must be submitted on Arc Testnet.", 400);
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const existingHash = await tx.transaction.findUnique({
        where: { txHash },
      });

      if (existingHash) {
        throw createConflict(
          "PAYMENT_ALREADY_EXISTS",
          "This transaction hash has already been recorded.",
          409,
        );
      }

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

      const merchantWallet = paymentLink.user.wallets[0]?.address;

      if (!merchantWallet || !isAddress(merchantWallet)) {
        throw createConflict("MERCHANT_WALLET_MISSING", "Merchant wallet is not configured.", 400);
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
          recipientAddress: merchantWallet,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          txHash,
          status: TransactionStatus.PENDING,
          metadata: {
            chainId: arcChainId,
            network: "Arc Testnet",
            paymentMode: "erc20-usdc",
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
              txHash,
              paymentLinkId: paymentLink.id,
              merchantWallet,
            },
          },
          {
            walletAddress: merchantWallet.toLowerCase(),
            action: "PAYMENT_LINK_PAID",
            entityType: "PaymentLink",
            entityId: paymentLink.id,
            metadata: {
              transactionId: transaction.id,
              txHash,
            },
          },
        ],
      });

      return transaction;
    });

    const paymentPayload = {
      id: transaction.id,
      paymentLinkId: transaction.paymentLinkId,
      txHash: transaction.txHash,
      amount: transaction.amount.toFixed(6),
      currency: transaction.currency,
      payerAddress: transaction.payerAddress,
      recipientAddress: transaction.recipientAddress,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
    };

    void emitWebhookEvent({
      userId: transaction.userId,
      type: "payment.created",
      data: paymentPayload,
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[webhooks] payment.created emit failed", error);
      }
    });

    void emitWebhookEvent({
      userId: transaction.userId,
      type: "payment.pending",
      data: paymentPayload,
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[webhooks] payment.pending emit failed", error);
      }
    });

    return NextResponse.json(
      {
        transaction: {
          id: transaction.id,
          txHash: transaction.txHash,
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
    if (isPaymentRecordConflict(error)) {
      return paymentError(error.code, error.message, error.status);
    }

    throw error;
  }
}
