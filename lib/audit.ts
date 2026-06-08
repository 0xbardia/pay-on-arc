import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  walletAddress?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog({
  walletAddress,
  action,
  entityType,
  entityId,
  metadata,
}: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        walletAddress: walletAddress?.toLowerCase() ?? null,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[audit] write failed", error);
    }
  }
}

export function authLog(event: string, metadata?: Record<string, unknown>) {
  console.info(`[auth] ${event}`, metadata ?? {});
}
