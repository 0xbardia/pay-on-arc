import "server-only";

import { NextResponse } from "next/server";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    {
      success: false,
      error: "Rate limit exceeded. Please retry shortly.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)).toString(),
      },
    },
  );
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const result = checkRateLimit({
    key: `${scope}:${getClientIp(request)}`,
    limit,
    windowMs,
  });

  return result.allowed ? null : rateLimitResponse(result.resetAt);
}
