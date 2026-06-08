import { NextResponse } from "next/server";
import { TransactionStatus } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.toUpperCase();
  const statusFilter =
    status && status !== "ALL" && status in TransactionStatus ? (status as TransactionStatus) : undefined;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: auth.user.id,
      status: statusFilter,
    },
    include: {
      paymentLink: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount.toFixed(6),
      currency: transaction.currency,
      paymentLinkTitle: transaction.paymentLink?.title ?? "Direct payment",
      payerAddress: transaction.payerAddress,
      recipientAddress: transaction.recipientAddress,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
    })),
  });
}
