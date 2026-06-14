import { NextResponse } from "next/server";
import { isAdminWallet } from "@/lib/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTransactionStatus } from "@/services/transaction-check";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

  const result = await checkTransactionStatus(transaction.id, {
    source: "manual-check",
    actorWallet: auth.wallet.address,
  });

  return NextResponse.json({
    transaction: {
      id: result.transaction?.id ?? transaction.id,
      status: result.transaction?.status ?? transaction.status,
      txHash: result.transaction?.txHash ?? transaction.txHash,
      reason: result.reason,
      message: result.message,
    },
  });
}
