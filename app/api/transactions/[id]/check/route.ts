import { NextResponse } from "next/server";
import { PaymentLinkStatus, TransactionStatus } from "@prisma/client";
import { createPublicClient, http } from "viem";
import { isAdminWallet } from "@/lib/admin";
import { arcRpcUrl } from "@/lib/arc-config";
import { getAuthenticatedUser } from "@/lib/auth";
import { arcTestnet } from "@/lib/chains/arc";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(arcRpcUrl),
});

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const canCheckAnyTransaction = isAdminWallet(auth.wallet.address);
  const transaction = await prisma.transaction.findFirst({
    where: canCheckAnyTransaction ? { id } : { id, userId: auth.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  if (!transaction.txHash) {
    return NextResponse.json({ error: "Transaction has no on-chain hash." }, { status: 400 });
  }

  const receipt = await publicClient.getTransactionReceipt({
    hash: transaction.txHash as `0x${string}`,
  }).catch(() => null);

  if (!receipt) {
    return NextResponse.json({
      transaction: {
        id: transaction.id,
        status: transaction.status,
      },
    });
  }

  const status = receipt.status === "success" ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED;
  const updated = await prisma.$transaction(async (tx) => {
    const checkedTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: { status },
    });

    if (status === TransactionStatus.CONFIRMED && checkedTransaction.paymentLinkId) {
      await tx.paymentLink.update({
        where: { id: checkedTransaction.paymentLinkId },
        data: { status: PaymentLinkStatus.PAID },
      });
    }

    await tx.auditLog.create({
      data: {
        walletAddress: checkedTransaction.recipientAddress?.toLowerCase() ?? auth.wallet.address,
        action:
          status === TransactionStatus.CONFIRMED
            ? "TRANSACTION_CONFIRMED"
            : "TRANSACTION_FAILED",
        entityType: "Transaction",
        entityId: checkedTransaction.id,
        metadata: {
          txHash: checkedTransaction.txHash,
          paymentLinkId: checkedTransaction.paymentLinkId,
          source: "manual-check",
        },
      },
    });

    return checkedTransaction;
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
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] payment status emit failed", error);
    }
  });

  return NextResponse.json({
    transaction: {
      id: updated.id,
      status: updated.status,
      txHash: updated.txHash,
    },
  });
}
