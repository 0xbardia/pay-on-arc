import "server-only";

import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { createPublicClient, http } from "viem";
import { arcRpcUrl } from "@/lib/arc-config";
import { arcTestnet } from "@/lib/chains/arc";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

const monitorIntervalMs = 30_000;
const confirmationTimeoutMs = 30 * 60 * 1000;

const globalForMonitor = globalThis as unknown as {
  arcpayTransactionMonitorStarted?: boolean;
  arcpayTransactionMonitorRunning?: boolean;
};

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(arcRpcUrl),
});

async function updateTransactionStatus(transactionId: string, status: TransactionStatus) {
  const updated = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.update({
      where: { id: transactionId },
      data: { status },
    });

    if (status === TransactionStatus.CONFIRMED && transaction.paymentLinkId) {
      await tx.paymentLink.update({
        where: { id: transaction.paymentLinkId },
        data: { status: PaymentLinkStatus.PAID },
      });
    }

    await tx.auditLog.create({
      data: {
        walletAddress: transaction.recipientAddress?.toLowerCase() ?? null,
        action:
          status === TransactionStatus.CONFIRMED
            ? "TRANSACTION_CONFIRMED"
            : "TRANSACTION_FAILED",
        entityType: "Transaction",
        entityId: transaction.id,
        metadata: {
          txHash: transaction.txHash,
          paymentLinkId: transaction.paymentLinkId,
          source: "transaction-monitor",
        },
      },
    });

    return transaction;
  });

  void emitWebhookEvent({
    userId: updated.userId,
    type: status === TransactionStatus.CONFIRMED ? "payment.confirmed" : "payment.failed",
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
      source: "transaction-monitor",
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] payment status emit failed", error);
    }
  });
}

export async function runTransactionMonitorOnce() {
  if (globalForMonitor.arcpayTransactionMonitorRunning) {
    return;
  }

  globalForMonitor.arcpayTransactionMonitorRunning = true;

  try {
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
        txHash: { not: null },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    for (const transaction of pendingTransactions) {
      if (!transaction.txHash) {
        continue;
      }

      if (Date.now() - transaction.createdAt.getTime() > confirmationTimeoutMs) {
        await updateTransactionStatus(transaction.id, TransactionStatus.FAILED);
        continue;
      }

      const receipt = await publicClient
        .getTransactionReceipt({ hash: transaction.txHash as `0x${string}` })
        .catch(() => null);

      if (!receipt) {
        continue;
      }

      await updateTransactionStatus(
        transaction.id,
        receipt.status === "success" ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED,
      );
    }
  } finally {
    globalForMonitor.arcpayTransactionMonitorRunning = false;
  }
}

export function startTransactionMonitor() {
  if (globalForMonitor.arcpayTransactionMonitorStarted) {
    return;
  }

  globalForMonitor.arcpayTransactionMonitorStarted = true;
  void runTransactionMonitorOnce();
  setInterval(() => {
    void runTransactionMonitorOnce();
  }, monitorIntervalMs);
}
