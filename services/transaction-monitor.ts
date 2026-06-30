import { backgroundJobTypes, enqueueJob } from "@/lib/jobs/queue";
import { enqueuePendingTransactionChecks } from "@/services/transaction-check";

export async function runTransactionMonitorOnce() {
  return enqueuePendingTransactionChecks((transactionId) =>
    enqueueJob(backgroundJobTypes.transactionCheck, { transactionId }),
  );
}

export function startTransactionMonitor() {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[jobs] startTransactionMonitor is disabled. Run `pnpm worker` instead.");
  }
}
