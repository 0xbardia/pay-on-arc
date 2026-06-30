import "server-only";

export function logDevRequest(label: string) {
  if (process.env.ARCPAY_DEBUG_REQUESTS === "1") {
    console.log(`[Pay On Arc request] ${label}`);
  }
}
