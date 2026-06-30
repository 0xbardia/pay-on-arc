import { randomUUID } from "crypto";
import { BackgroundJobStatus, type BackgroundJob } from "@prisma/client";
import {
  backgroundJobTypes,
  claimNextJobs,
  markJobCompleted,
  markJobFailed,
  releaseStaleJobs,
} from "@/lib/jobs/queue";
import { prisma } from "@/lib/prisma";
import { processDueWebhookDeliveries, processWebhookDelivery } from "@/lib/webhooks/deliver";
import { runTransactionMonitorOnce } from "@/services/transaction-monitor";
import { checkTransactionStatus } from "@/services/transaction-check";

const workerId = `worker_${process.pid}_${randomUUID().slice(0, 8)}`;
const pollIntervalMs = Number(process.env.JOB_WORKER_POLL_INTERVAL_MS ?? "5000");
const scanIntervalMs = Number(process.env.JOB_WORKER_SCAN_INTERVAL_MS ?? "30000");
const staleJobMaxAgeSeconds = Number(process.env.JOB_WORKER_STALE_SECONDS ?? "120");
const claimLimit = Number(process.env.JOB_WORKER_CLAIM_LIMIT ?? "10");

let shuttingDown = false;
let lastScanAt = 0;

function log(level: "info" | "warn" | "error", message: string, metadata?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    workerId,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

function readPayload(job: BackgroundJob) {
  if (typeof job.payload !== "object" || job.payload === null || Array.isArray(job.payload)) {
    throw new Error(`Invalid payload for ${job.type}.`);
  }

  return job.payload as Record<string, unknown>;
}

async function processJob(job: BackgroundJob) {
  if (job.status !== BackgroundJobStatus.RUNNING) {
    return;
  }

  if (job.type === backgroundJobTypes.webhookDelivery) {
    const payload = readPayload(job);

    if (typeof payload.deliveryId !== "string") {
      throw new Error("WEBHOOK_DELIVERY payload is missing deliveryId.");
    }

    await processWebhookDelivery(payload.deliveryId);
    return;
  }

  if (job.type === backgroundJobTypes.transactionCheck) {
    const payload = readPayload(job);

    if (typeof payload.transactionId !== "string") {
      throw new Error("TRANSACTION_CHECK payload is missing transactionId.");
    }

    const result = await checkTransactionStatus(payload.transactionId, {
      source: "job-worker",
    });

    if (result.transient) {
      throw new Error(result.message ?? result.reason ?? "Transaction verification is not ready.");
    }

    return;
  }

  throw new Error(`Unsupported background job type: ${job.type}`);
}

async function scanForWork() {
  const now = Date.now();

  if (now - lastScanAt < scanIntervalMs) {
    return;
  }

  lastScanAt = now;
  await processDueWebhookDeliveries();
  const transactionCount = await runTransactionMonitorOnce();

  if (transactionCount > 0) {
    log("info", "queued pending transaction checks", { transactionCount });
  }
}

async function runOnce() {
  await scanForWork();

  const jobs = await claimNextJobs(workerId, claimLimit);

  if (jobs.length === 0) {
    return;
  }

  log("info", "claimed jobs", { count: jobs.length });

  for (const job of jobs) {
    try {
      await processJob(job);
      await markJobCompleted(job.id);
      log("info", "completed job", { jobId: job.id, type: job.type });
    } catch (error) {
      await markJobFailed(job.id, error);
      log("warn", "failed job attempt", {
        jobId: job.id,
        type: job.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  await releaseStaleJobs(staleJobMaxAgeSeconds);
  log("info", "Pay On Arc worker started");

  while (!shuttingDown) {
    try {
      await runOnce();
    } catch (error) {
      log("error", "worker loop failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await wait(pollIntervalMs);
  }

  log("info", "Pay On Arc worker stopped");
  await prisma.$disconnect();
}

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

if (process.argv.includes("--help")) {
  console.log("Usage: pnpm worker");
  console.log("Runs the Pay On Arc durable background job worker.");
  process.exit(0);
}

main().catch(async (error) => {
  log("error", "worker fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  await prisma.$disconnect();
  process.exit(1);
});
