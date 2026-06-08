import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeMerchantProfile, validateMerchantProfile, type MerchantProfileInput } from "@/lib/merchant-profile";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({
    profile: serializeMerchantProfile(auth.user),
  });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as MerchantProfileInput | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateMerchantProfile(body);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Merchant profile contains invalid fields.",
        fields: validation.errors,
      },
      { status: 400 },
    );
  }

  if (validation.data.merchantSlug) {
    const existingSlug = await prisma.user.findFirst({
      where: {
        merchantSlug: validation.data.merchantSlug,
        id: { not: auth.user.id },
      },
      select: { id: true },
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Merchant profile contains invalid fields.",
          fields: { merchantSlug: "This merchant slug is already in use." },
        },
        { status: 409 },
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: validation.data,
  });

  void emitWebhookEvent({
    userId: auth.user.id,
    type: "merchant.updated",
    data: {
      profile: serializeMerchantProfile(user),
      updatedAt: user.updatedAt.toISOString(),
    },
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[webhooks] merchant.updated emit failed", error);
    }
  });

  return NextResponse.json({
    profile: serializeMerchantProfile(user),
  });
}
