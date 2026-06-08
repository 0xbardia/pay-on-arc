import { NextResponse } from "next/server";
import {
  createSignedNonceToken,
  createWalletNonce,
  walletNonceCookieName,
  walletNonceCookieOptions,
} from "@/lib/session";
import { authLog } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const limited = enforceRateLimit(request, "auth:nonce", 30, 60_000);

  if (limited) {
    return limited;
  }

  const nonce = createWalletNonce();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim() || new URL(request.url).host;
  const issuedAt = new Date().toISOString();
  const response = NextResponse.json({ nonce, domain: host, issuedAt });

  response.cookies.set(walletNonceCookieName, createSignedNonceToken(nonce, { domain: host, issuedAt }), walletNonceCookieOptions(request));
  authLog("AUTH_NONCE_CREATED");

  return response;
}
