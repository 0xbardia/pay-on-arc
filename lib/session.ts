import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const walletSessionCookieName = "arcpay_session";
export const walletNonceCookieName = "arcpay_wallet_nonce";

const sessionTtlSeconds = 60 * 60 * 24 * 7;
const nonceTtlSeconds = 60 * 10;

type WalletSessionPayload = {
  userId: string;
  address: string;
  expiresAt: number;
  domain?: string;
  issuedAt?: string;
};

type WalletNoncePayload = {
  nonce: string;
  domain: string;
  issuedAt: string;
};

function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return "development-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodePayload(payload: WalletSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): WalletSessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as WalletSessionPayload;

    if (
      typeof payload.userId !== "string" ||
      typeof payload.address !== "string" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createWalletSessionToken(userId: string, address: string) {
  const payload = encodePayload({
    userId,
    address,
    expiresAt: Date.now() + sessionTtlSeconds * 1000,
  });
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function createWalletNonce() {
  return randomBytes(24).toString("base64url");
}

export function createSignedNonceToken(nonce: string, { domain, issuedAt }: { domain: string; issuedAt: string }) {
  const payload = encodePayload({
    userId: "nonce",
    address: nonce,
    domain,
    issuedAt,
    expiresAt: Date.now() + nonceTtlSeconds * 1000,
  });

  return `${payload}.${sign(payload)}`;
}

export function verifySignedNonceToken(token?: string): WalletNoncePayload | null {
  const payload = verifyWalletSessionToken(token);

  if (!payload || payload.userId !== "nonce" || !payload.domain || !payload.issuedAt) {
    return null;
  }

  return {
    nonce: payload.address,
    domain: payload.domain,
    issuedAt: payload.issuedAt,
  };
}

export function verifyWalletSessionToken(token?: string): WalletSessionPayload | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  const decoded = decodePayload(payload);

  if (!decoded || decoded.expiresAt < Date.now()) {
    return null;
  }

  return decoded;
}

export async function getCurrentWalletSession() {
  const cookieStore = await cookies();

  return verifyWalletSessionToken(cookieStore.get(walletSessionCookieName)?.value);
}

export function shouldUseSecureCookies(request?: Request) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (!request) {
    return true;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function walletSessionCookieOptions(request?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: sessionTtlSeconds,
  };
}

export function walletNonceCookieOptions(request?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: nonceTtlSeconds,
  };
}

export function clearWalletCookieOptions(request?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: 0,
  };
}
