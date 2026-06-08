import { NextResponse } from "next/server";
import { PaymentLinkStatus } from "@prisma/client";
import { getPaymentUrl, getRequestOrigin, isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const paymentLink = await prisma.paymentLink.findUnique({
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
    },
  });

  if (!paymentLink) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }

  const status =
    paymentLink.status === PaymentLinkStatus.ACTIVE && isPaymentLinkExpired(paymentLink.expiresAt)
      ? PaymentLinkStatus.EXPIRED
      : paymentLink.status;

  return NextResponse.json({
    paymentLink: {
      id: paymentLink.id,
      slug: paymentLink.slug,
      title: paymentLink.title,
      description: paymentLink.description,
      amount: paymentLink.amount.toFixed(6),
      currency: paymentLink.currency,
      status,
      expiresAt: paymentLink.expiresAt?.toISOString() ?? null,
      createdAt: paymentLink.createdAt.toISOString(),
      publicUrl: getPaymentUrl(paymentLink.slug, getRequestOrigin(request.headers)),
      merchantAddress: paymentLink.user.wallets[0]?.address ?? null,
    },
  });
}
