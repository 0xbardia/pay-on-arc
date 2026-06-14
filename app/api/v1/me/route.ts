import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";
import { serializeMerchantProfile } from "@/lib/merchant-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        error: auth.error,
        message: auth.message,
      },
      { status: auth.status },
    );
  }

  return NextResponse.json({
    merchant: {
      id: auth.user.id,
      profile: serializeMerchantProfile(auth.user),
      walletAddress: auth.wallet?.address ?? null,
      chainId: auth.wallet?.chainId ?? null,
      createdAt: auth.user.createdAt.toISOString(),
    },
  });
}
