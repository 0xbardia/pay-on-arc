import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const apiKeyPrefix = "arcpay_live_";
const secretAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const authWindowMs = 60_000;
const maxAuthAttempts = 60;

export type ApiKeyAuthResult =
  | {
      ok: true;
      user: {
        id: string;
        createdAt: Date;
        merchantName: string | null;
        merchantSlug: string | null;
        merchantEmail: string | null;
        supportEmail: string | null;
        websiteUrl: string | null;
        logoUrl: string | null;
      };
      wallet: {
        address: string;
        chainId: number | null;
        connectorName: string | null;
      } | null;
      apiKeyId: string;
    }
  | { ok: false; status: number; error: string; message: string };

function randomSecret(length = 30) {
  const bytes = randomBytes(length);
  let secret = "";

  for (const byte of bytes) {
    secret += secretAlphabet[byte % secretAlphabet.length];
  }

  return secret;
}

function getRateLimitKey(request: Request, token?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const host = forwardedFor || "unknown";
  return `${host}:${token?.slice(0, 18) ?? "missing"}`;
}

function checkRateLimit(request: Request, token?: string) {
  const now = Date.now();
  const key = getRateLimitKey(request, token);
  const current = authAttempts.get(key);

  if (!current || current.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + authWindowMs });
    return true;
  }

  if (current.count >= maxAuthAttempts) {
    return false;
  }

  current.count += 1;
  return true;
}

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey() {
  const rawKey = `${apiKeyPrefix}${randomSecret()}`;
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, apiKeyPrefix.length + 4),
    keyHash: hashApiKey(rawKey),
  };
}

export function maskApiKey(keyPrefix: string) {
  return `${keyPrefix}************`;
}

export function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const parts = authorization.trim().split(/\s+/);
  const [scheme, token] = parts;

  if (parts.length !== 2 || scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function isExpectedApiKeyFormat(token: string) {
  return /^arcpay_live_[A-Z0-9]{20,}$/.test(token);
}

function safeHashCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export async function authenticateApiKey(request: Request): Promise<ApiKeyAuthResult> {
  const token = extractBearerToken(request);

  if (!checkRateLimit(request, token ?? undefined)) {
    return {
      ok: false,
      status: 429,
      error: "RATE_LIMITED",
      message: "Too many API authentication attempts. Please retry shortly.",
    };
  }

  if (!token || !isExpectedApiKeyFormat(token)) {
    return {
      ok: false,
      status: 401,
      error: "INVALID_API_KEY",
      message: "A valid Bearer API key is required.",
    };
  }

  const keyHash = hashApiKey(token);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        include: {
          wallets: { orderBy: { lastConnectedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!apiKey || !safeHashCompare(apiKey.keyHash, keyHash)) {
    return {
      ok: false,
      status: 401,
      error: "INVALID_API_KEY",
      message: "A valid Bearer API key is required.",
    };
  }

  if (apiKey.revokedAt) {
    return {
      ok: false,
      status: 401,
      error: "API_KEY_REVOKED",
      message: "This API key has been revoked.",
    };
  }

  const updatedKey = await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
    select: { id: true, lastUsedAt: true },
  });

  const wallet = apiKey.user.wallets[0] ?? null;

  await writeAuditLog({
    walletAddress: wallet?.address ?? null,
    action: "api_key_used",
    entityType: "ApiKey",
    entityId: apiKey.id,
    metadata: {
      keyPrefix: apiKey.keyPrefix,
      lastUsedAt: updatedKey.lastUsedAt?.toISOString() ?? null,
    },
  });

  return {
    ok: true,
    user: apiKey.user,
    wallet: wallet
      ? {
          address: wallet.address,
          chainId: wallet.chainId,
          connectorName: wallet.connectorName,
        }
      : null,
    apiKeyId: apiKey.id,
  };
}
