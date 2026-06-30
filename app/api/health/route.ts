import { NextResponse } from "next/server";
import { appVersion, getEnvValidation } from "@/lib/env";
import { getJobStats } from "@/lib/jobs/queue";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let database: "ok" | "error" = "ok";
  let jobs: Record<string, number> | "unavailable" = "unavailable";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  try {
    jobs = await getJobStats();
  } catch {
    jobs = "unavailable";
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
      jobs,
    },
    { status: healthy ? 200 : 503 },
  );
}
