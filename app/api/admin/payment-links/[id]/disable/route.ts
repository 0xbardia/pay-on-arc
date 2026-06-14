import { NextResponse } from "next/server";
import { PaymentLinkStatus } from "@prisma/client";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { auth, isAdmin } = await getAdminUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access denied." }, { status: 403 });
  }

  const { id } = await params;
  const paymentLink = await prisma.paymentLink.findUnique({
    where: { id },
  });

  if (!paymentLink) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }

  if (paymentLink.status !== PaymentLinkStatus.ACTIVE) {
    return NextResponse.json({ error: "Only active payment links can be disabled." }, { status: 400 });
  }

  const updated = await prisma.paymentLink.update({
    where: { id },
    data: { status: PaymentLinkStatus.DISABLED },
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "ADMIN_ACTION",
    entityType: "PaymentLink",
    entityId: updated.id,
    metadata: {
      action: "PAYMENT_LINK_DISABLED",
    },
  });

  return NextResponse.json({
    paymentLink: {
      id: updated.id,
      status: updated.status,
    },
  });
}
