import { NextResponse } from "next/server";
import { PaymentLinkStatus, Prisma } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createPaymentSlug, getPaymentUrl, getRequestOrigin, isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

type CreatePaymentLinkBody = {
  amount?: string;
  currency?: string;
  title?: string;
  description?: string;
  expiresAt?: string;
};

function serializePaymentLink(link: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  amount: Prisma.Decimal;
  currency: string;
  status: PaymentLinkStatus;
  expiresAt: Date | null;
  createdAt: Date;
}, requestOrigin?: string) {
  const computedStatus =
    link.status === PaymentLinkStatus.ACTIVE && isPaymentLinkExpired(link.expiresAt)
      ? PaymentLinkStatus.EXPIRED
      : link.status;

  return {
    id: link.id,
    slug: link.slug,
    title: link.title,
    description: link.description,
    amount: link.amount.toFixed(6),
    currency: link.currency,
    status: computedStatus,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    publicUrl: getPaymentUrl(link.slug, requestOrigin),
  };
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const links = await prisma.paymentLink.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  const requestOrigin = getRequestOrigin(request.headers);

  return NextResponse.json({ paymentLinks: links.map((link) => serializePaymentLink(link, requestOrigin)) });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreatePaymentLinkBody | null;
  const title = body?.title?.trim();
  const amount = body?.amount?.trim();
  const currency = (body?.currency?.trim() || "USDC").toUpperCase();

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  if (currency !== "USDC") {
    return NextResponse.json({ error: "Only USDC is supported in Phase 3." }, { status: 400 });
  }

  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "expiresAt must be a valid date." }, { status: 400 });
  }

  const link = await prisma.paymentLink.create({
    data: {
      userId: auth.user.id,
      slug: createPaymentSlug(title),
      title,
      description: body?.description?.trim() || null,
      amount: new Prisma.Decimal(amount),
      currency,
      status: PaymentLinkStatus.ACTIVE,
      expiresAt,
    },
  });

  await writeAuditLog({
    walletAddress: auth.wallet.address,
    action: "PAYMENT_LINK_CREATED",
    entityType: "PaymentLink",
    entityId: link.id,
    metadata: {
      slug: link.slug,
      amount: link.amount.toFixed(6),
      currency: link.currency,
    },
  });

  void emitWebhookEvent({
    userId: auth.user.id,
    type: "link.created",
    data: {
      id: link.id,
      slug: link.slug,
      title: link.title,
      amount: link.amount.toFixed(6),
      currency: link.currency,
      status: link.status,
      createdAt: link.createdAt.toISOString(),
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] link.created emit failed", error);
    }
  });

  return NextResponse.json(
    { paymentLink: serializePaymentLink(link, getRequestOrigin(request.headers)) },
    { status: 201 },
  );
}
