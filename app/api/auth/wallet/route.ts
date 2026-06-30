import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAddress, verifyMessage, type Hex } from "viem";
import { buildWalletLoginMessage } from "@/lib/auth-message";
import { prisma } from "@/lib/prisma";
import { authLog, writeAuditLog } from "@/lib/audit";
import {
  clearWalletCookieOptions,
  createWalletSessionToken,
  verifySignedNonceToken,
  walletNonceCookieName,
  walletSessionCookieName,
  walletSessionCookieOptions,
} from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type WalletAuthBody = {
  address?: string;
  signature?: string;
  message?: string;
  chainId?: number;
  connectorName?: string;
};

function authError(error: string, message: string, status: number) {
  authLog("AUTH_FAILURE", { error, status });
  return NextResponse.json({ error, message }, { status });
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "auth:wallet", 20, 60_000);

  if (limited) {
    return limited;
  }

  const body = (await request.json().catch(() => null)) as WalletAuthBody | null;
  const address = body?.address?.toLowerCase();

  if (!address || !isAddress(address)) {
    return authError("INVALID_ADDRESS", "A valid wallet address is required.", 400);
  }

  if (!body?.signature || !body.message) {
    return authError("MISSING_SIGNATURE", "A signed login message is required.", 400);
  }

  authLog("AUTH_SIGNATURE_RECEIVED", { address });

  const cookieStore = await cookies();
  const noncePayload = verifySignedNonceToken(cookieStore.get(walletNonceCookieName)?.value);

  if (!noncePayload) {
    return authError(
      "NONCE_EXPIRED",
      "Login nonce is missing or expired. Please retry signing.",
      401,
    );
  }

  const expectedMessage = buildWalletLoginMessage({
    address,
    nonce: noncePayload.nonce,
    domain: noncePayload.domain,
    issuedAt: noncePayload.issuedAt,
    chainId: body.chainId,
  });

  if (body.message !== expectedMessage) {
    return authError(
      "NONCE_EXPIRED",
      "Login nonce is missing or expired. Please retry signing.",
      401,
    );
  }

  const isValidSignature = await verifyMessage({
    address,
    message: body.message,
    signature: body.signature as Hex,
  }).catch(() => false);

  if (!isValidSignature) {
    return authError("INVALID_SIGNATURE", "Signature verification failed.", 401);
  }

  authLog("AUTH_SIGNATURE_VERIFIED", { address });

  const now = new Date();
  const existingWallet = await prisma.wallet.findUnique({
    where: { address },
  });

  const user = existingWallet
    ? await prisma.user.update({
        where: { id: existingWallet.userId },
        data: { lastLoginAt: now },
      })
    : await prisma.user.create({
        data: { lastLoginAt: now },
      });

  const wallet = await prisma.wallet.upsert({
    where: { address },
    create: {
      address,
      chainId: body.chainId,
      connectorName: body.connectorName,
      lastConnectedAt: now,
      network: "evm",
      userId: user.id,
    },
    update: {
      chainId: body.chainId,
      connectorName: body.connectorName,
      lastConnectedAt: now,
      network: "evm",
      userId: user.id,
    },
  });

  const response = NextResponse.json({
    user: { id: user.id },
    wallet: {
      id: wallet.id,
      address: wallet.address,
      chainId: wallet.chainId,
      connectorName: wallet.connectorName,
    },
  });

  response.cookies.set(
    walletSessionCookieName,
    createWalletSessionToken(user.id, wallet.address),
    walletSessionCookieOptions(request),
  );
  response.cookies.set(walletNonceCookieName, "", clearWalletCookieOptions(request));
  authLog("AUTH_SESSION_CREATED", { address, userId: user.id });
  await writeAuditLog({
    walletAddress: wallet.address,
    action: "AUTH_LOGIN",
    entityType: "User",
    entityId: user.id,
    metadata: {
      chainId: body.chainId ?? null,
      connectorName: body.connectorName ?? null,
    },
  });

  return response;
}
