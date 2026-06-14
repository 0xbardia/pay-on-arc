import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: auth.user.id },
    include: { paymentLink: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const rows = [
    ["transaction id", "payment link", "amount", "currency", "payer", "recipient", "status", "txHash", "createdAt"],
    ...transactions.map((transaction) => [
      transaction.id,
      transaction.paymentLink?.title ?? "",
      transaction.amount.toFixed(6),
      transaction.currency,
      transaction.payerAddress ?? "",
      transaction.recipientAddress ?? "",
      transaction.status,
      transaction.txHash ?? "",
      transaction.createdAt.toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pay-on-arc-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
