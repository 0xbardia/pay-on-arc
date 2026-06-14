import { PaymentLinkStatus, TransactionStatus, type Prisma } from "@prisma/client";
import { arcUsdcDecimals, getArcUsdcAddress } from "@/lib/arc-config";
import {
  isTransientPaymentVerificationReason,
  verifyUsdcPaymentTx,
} from "@/lib/payment-verification";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

type CheckTransactionOptions = {
  source: string;
  actorWallet?: string | null;
};

export type TransactionCheckResult = {
  found: boolean;
  updated: boolean;
  transient: boolean;
  transaction?: {
    id: string;
    status: TransactionStatus;
    txHash: string | null;
  };
  error?: string;
  message?: string;
  reason?: string;
};

function mergeMetadata(
  metadata: Prisma.JsonValue,
  verification: Prisma.InputJsonObject,
): Prisma.InputJsonObject {
  return {
    ...(typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
      ? metadata
      : {}),
    verification,
    verificationCheckedAt: new Date().toISOString(),
  };
}

export async function checkTransactionStatus(
  transactionId: string,
  options: CheckTransactionOptions,
): Promise<TransactionCheckResult> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return {
      found: false,
      updated: false,
      transient: false,
      error: "TRANSACTION_NOT_FOUND",
      message: "Transaction not found.",
    };
  }

  if (transaction.status === TransactionStatus.CONFIRMED || transaction.status === TransactionStatus.FAILED) {
    return {
      found: true,
      updated: false,
      transient: false,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        txHash: transaction.txHash,
      },
    };
  }

  if (!transaction.txHash) {
    return {
      found: true,
      updated: false,
      transient: false,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        txHash: transaction.txHash,
      },
      error: "TRANSACTION_HASH_MISSING",
      message: "Transaction has no on-chain hash.",
    };
  }

  if (!transaction.recipientAddress) {
    return {
      found: true,
      updated: false,
      transient: false,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        txHash: transaction.txHash,
      },
      error: "RECIPIENT_MISSING",
      message: "Transaction has no merchant recipient wallet.",
    };
  }

  const verification = await verifyUsdcPaymentTx({
    txHash: transaction.txHash,
    expectedRecipient: transaction.recipientAddress,
    expectedAmount: transaction.amount.toFixed(6),
    expectedToken: getArcUsdcAddress(),
    expectedDecimals: arcUsdcDecimals,
    expectedPayer: transaction.payerAddress,
  });

  if (!verification.ok && isTransientPaymentVerificationReason(verification.reason)) {
    return {
      found: true,
      updated: false,
      transient: true,
      reason: verification.reason,
      message: verification.message,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        txHash: transaction.txHash,
      },
    };
  }

  const nextStatus = verification.ok ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED;
  const verificationJson = verification as Prisma.InputJsonObject;
  const updated = await prisma.$transaction(async (tx) => {
    const checkedTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: nextStatus,
        metadata: mergeMetadata(transaction.metadata, verificationJson),
      },
    });

    if (nextStatus === TransactionStatus.CONFIRMED && checkedTransaction.paymentLinkId) {
      await tx.paymentLink.update({
        where: { id: checkedTransaction.paymentLinkId },
        data: { status: PaymentLinkStatus.PAID },
      });
    }

    await tx.auditLog.create({
      data: {
        walletAddress:
          checkedTransaction.recipientAddress?.toLowerCase() ??
          options.actorWallet?.toLowerCase() ??
          null,
        action:
          nextStatus === TransactionStatus.CONFIRMED
            ? "TRANSACTION_CONFIRMED"
            : "TRANSACTION_FAILED",
        entityType: "Transaction",
        entityId: checkedTransaction.id,
        metadata: {
          txHash: checkedTransaction.txHash,
          paymentLinkId: checkedTransaction.paymentLinkId,
          reason: verification.reason,
          message: verification.message,
          verification: verificationJson,
          source: options.source,
        },
      },
    });

    return checkedTransaction;
  });

  void emitWebhookEvent({
    userId: updated.userId,
    type: nextStatus === TransactionStatus.CONFIRMED ? "payment.confirmed" : "payment.failed",
    data: {
      id: updated.id,
      paymentLinkId: updated.paymentLinkId,
      txHash: updated.txHash,
      amount: updated.amount.toFixed(6),
      currency: updated.currency,
      payerAddress: updated.payerAddress,
      recipientAddress: updated.recipientAddress,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
      source: options.source,
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] payment status emit failed", error);
    }
  });

  return {
    found: true,
    updated: true,
    transient: false,
    reason: verification.reason,
    message: verification.message,
    transaction: {
      id: updated.id,
      status: updated.status,
      txHash: updated.txHash,
    },
  };
}

export async function enqueuePendingTransactionChecks(enqueue: (transactionId: string) => Promise<unknown>) {
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.PENDING,
      txHash: { not: null },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  await Promise.all(pendingTransactions.map((transaction) => enqueue(transaction.id)));

  return pendingTransactions.length;
}
