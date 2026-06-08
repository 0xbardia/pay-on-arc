export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startTransactionMonitor } = await import("@/services/transaction-monitor");

    startTransactionMonitor();
  }
}
