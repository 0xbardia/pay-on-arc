import { BackgroundJobStatus, type BackgroundJob, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const backgroundJobTypes = {
  webhookDelivery: "WEBHOOK_DELIVERY",
  transactionCheck: "TRANSACTION_CHECK",
} as const;

export type BackgroundJobType = (typeof backgroundJobTypes)[keyof typeof backgroundJobTypes];

type WebhookDeliveryPayload = {
  deliveryId: string;
};

type TransactionCheckPayload = {
  transactionId: string;
};

export type BackgroundJobPayload = WebhookDeliveryPayload | TransactionCheckPayload;

type EnqueueJobOptions = {
  runAt?: Date;
  maxAttempts?: number;
  dedupe?: boolean;
};

type MarkJobFailedOptions = {
  retryDelayMs?: number;
};

const defaultMaxAttempts = 5;
const maxErrorLength = 2000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePayload(type: BackgroundJobType, payload: unknown): BackgroundJobPayload {
  if (!isPlainObject(payload)) {
    throw new Error("Background job payload must be an object.");
  }

  if (type === backgroundJobTypes.webhookDelivery) {
    if (typeof payload.deliveryId !== "string" || payload.deliveryId.length === 0) {
      throw new Error("WEBHOOK_DELIVERY requires deliveryId.");
    }

    return { deliveryId: payload.deliveryId };
  }

  if (type === backgroundJobTypes.transactionCheck) {
    if (typeof payload.transactionId !== "string" || payload.transactionId.length === 0) {
      throw new Error("TRANSACTION_CHECK requires transactionId.");
    }

    return { transactionId: payload.transactionId };
  }

  throw new Error(`Unsupported background job type: ${type}`);
}

function getPayloadDedupeFilter(type: BackgroundJobType, payload: BackgroundJobPayload) {
  if (type === backgroundJobTypes.webhookDelivery && "deliveryId" in payload) {
    return {
      payload: {
        path: ["deliveryId"],
        equals: payload.deliveryId,
      },
    };
  }

  if (type === backgroundJobTypes.transactionCheck && "transactionId" in payload) {
    return {
      payload: {
        path: ["transactionId"],
        equals: payload.transactionId,
      },
    };
  }

  return {};
}

function truncateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > maxErrorLength ? `${message.slice(0, maxErrorLength)}...` : message;
}

export function getJobRetryDelayMs(attempts: number) {
  const baseDelayMs = 30_000;
  const cappedPower = Math.min(Math.max(attempts - 1, 0), 6);
  return baseDelayMs * 2 ** cappedPower;
}

export async function enqueueJob(
  type: BackgroundJobType,
  payloadInput: unknown,
  options: EnqueueJobOptions = {},
) {
  const payload = validatePayload(type, payloadInput);
  const shouldDedupe = options.dedupe ?? true;

  if (shouldDedupe) {
    const existing = await prisma.backgroundJob.findFirst({
      where: {
        type,
        status: { in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.RUNNING] },
        ...getPayloadDedupeFilter(type, payload),
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.backgroundJob.create({
    data: {
      type,
      payload: payload as Prisma.InputJsonObject,
      runAt: options.runAt ?? new Date(),
      maxAttempts: options.maxAttempts ?? defaultMaxAttempts,
    },
  });
}

export async function claimNextJobs(workerId: string, limit = 10) {
  const safeLimit = Math.max(1, Math.min(limit, 50));

  return prisma.$queryRaw<BackgroundJob[]>`
    UPDATE "BackgroundJob"
    SET
      "status" = 'RUNNING'::"BackgroundJobStatus",
      "lockedAt" = NOW(),
      "lockedBy" = ${workerId},
      "attempts" = "attempts" + 1,
      "updatedAt" = NOW()
    WHERE "id" IN (
      SELECT "id"
      FROM "BackgroundJob"
      WHERE "status" = 'PENDING'::"BackgroundJobStatus"
        AND "runAt" <= NOW()
      ORDER BY "runAt" ASC, "createdAt" ASC
      LIMIT ${safeLimit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;
}

export async function markJobCompleted(jobId: string) {
  return prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: BackgroundJobStatus.COMPLETED,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

export async function markJobFailed(
  jobId: string,
  error: unknown,
  options: MarkJobFailedOptions = {},
) {
  const job = await prisma.backgroundJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return null;
  }

  const exhausted = job.attempts >= job.maxAttempts;
  const retryDelayMs = options.retryDelayMs ?? getJobRetryDelayMs(job.attempts);

  return prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: exhausted ? BackgroundJobStatus.FAILED : BackgroundJobStatus.PENDING,
      runAt: exhausted ? job.runAt : new Date(Date.now() + retryDelayMs),
      lockedAt: null,
      lockedBy: null,
      lastError: truncateError(error),
    },
  });
}

export async function releaseStaleJobs(maxAgeSeconds: number) {
  const staleBefore = new Date(Date.now() - maxAgeSeconds * 1000);

  return prisma.backgroundJob.updateMany({
    where: {
      status: BackgroundJobStatus.RUNNING,
      lockedAt: { lt: staleBefore },
    },
    data: {
      status: BackgroundJobStatus.PENDING,
      lockedAt: null,
      lockedBy: null,
      lastError: "Released stale running job.",
    },
  });
}

export async function getJobStats() {
  const grouped = await prisma.backgroundJob.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return grouped.reduce<Record<string, number>>((stats, item) => {
    stats[item.status.toLowerCase()] = item._count._all;
    return stats;
  }, {});
}
