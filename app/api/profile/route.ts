import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeMerchantProfile, validateMerchantProfile, type MerchantProfileInput } from "@/lib/merchant-profile";
import { prisma } from "@/lib/prisma";
import { emitWebhookEvent } from "@/lib/webhooks/deliver";
import { authLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  authLog("PROFILE_LOAD_STARTED");
  const auth = await getAuthenticatedUser();

  if (!auth) {
    authLog("PROFILE_LOAD_FAILED", { reason: "unauthenticated" });
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const profile = serializeMerchantProfile(auth.user);
  authLog("PROFILE_LOAD_SUCCESS", { userId: auth.user.id });
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  authLog("PROFILE_SAVE_STARTED");
  const auth = await getAuthenticatedUser();

  if (!auth) {
    authLog("PROFILE_SAVE_FAILED", { reason: "unauthenticated" });
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as MerchantProfileInput | null;

  if (!body) {
    authLog("PROFILE_SAVE_FAILED", { reason: "invalid_json", userId: auth.user.id });
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateMerchantProfile(body);

  if (!validation.ok) {
    authLog("PROFILE_SAVE_FAILED", { reason: "validation_error", userId: auth.user.id, errors: validation.errors });
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
      authLog("PROFILE_SAVE_FAILED", { reason: "duplicate_slug", userId: auth.user.id });
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

  authLog("PROFILE_SAVE_SUCCESS", { userId: auth.user.id });
  return NextResponse.json({
    profile: serializeMerchantProfile(user),
  });
}
