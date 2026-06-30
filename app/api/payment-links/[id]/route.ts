import { NextResponse } from "next/server";
import { PaymentLinkStatus } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdatePaymentLinkBody = {
  status?: PaymentLinkStatus;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as UpdatePaymentLinkBody | null;

  if (body?.status !== PaymentLinkStatus.DISABLED) {
    return NextResponse.json({ error: "Only disabling payment links is supported." }, { status: 400 });
  }

  const existing = await prisma.paymentLink.findFirst({
    where: {
      id,
      userId: auth.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }

  const paymentLink = await prisma.paymentLink.update({
    where: { id },
    data: { status: PaymentLinkStatus.DISABLED },
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "PAYMENT_LINK_DISABLED",
    entityType: "PaymentLink",
    entityId: paymentLink.id,
  });

  void emitWebhookEvent({
    userId: auth.user.id,
    type: "link.disabled",
    data: {
      id: paymentLink.id,
      slug: paymentLink.slug,
      title: paymentLink.title,
      status: paymentLink.status,
      updatedAt: paymentLink.updatedAt.toISOString(),
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] link.disabled emit failed", error);
    }
  });

  return NextResponse.json({
    paymentLink: {
      id: paymentLink.id,
      status: paymentLink.status,
    },
  });
}
