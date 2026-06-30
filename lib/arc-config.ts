import { isAddress, type Address } from "viem";

export const arcChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? "5042002");
export const arcRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
export const arcExplorerUrl = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";
export const arcUsdcAddress = (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000") as Address;
export const arcUsdcDecimals = Number(process.env.NEXT_PUBLIC_ARC_USDC_DECIMALS ?? "6");
export const enableSimulatedPayments = process.env.ENABLE_SIMULATED_PAYMENTS === "true";

export function getExplorerTxUrl(txHash: string) {
  return `${arcExplorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export function getArcUsdcAddress() {
  if (!isAddress(arcUsdcAddress)) {
    throw new Error("NEXT_PUBLIC_ARC_USDC_ADDRESS must be a valid address.");
  }

  return arcUsdcAddress;
}
