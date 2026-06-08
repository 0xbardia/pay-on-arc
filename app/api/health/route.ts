import { NextResponse } from "next/server";
import { appVersion, getEnvValidation } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const env = getEnvValidation();
  const healthy = database === "ok" && env.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: appVersion,
      database,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      env: env.ok ? "ok" : "missing_required_values",
    },
    { status: healthy ? 200 : 503 },
  );
}
