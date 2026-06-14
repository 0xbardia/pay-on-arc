import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentWalletSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCurrentWalletSession();

  if (!session) {
    return NextResponse.json({ user: null, wallet: null }, { status: 401 });
  }

  const requestedAddress = new URL(request.url).searchParams.get("address")?.toLowerCase();

  if (requestedAddress && requestedAddress !== session.address.toLowerCase()) {
    return NextResponse.json({ user: null, wallet: null, error: "ADDRESS_MISMATCH" }, { status: 401 });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { address: session.address },
    include: { user: true },
  });

  if (!wallet) {
    return NextResponse.json({ user: null, wallet: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: wallet.user.id,
      lastLoginAt: wallet.user.lastLoginAt,
    },
    wallet: {
      id: wallet.id,
      address: wallet.address,
      chainId: wallet.chainId,
      connectorName: wallet.connectorName,
    },
  });
}
