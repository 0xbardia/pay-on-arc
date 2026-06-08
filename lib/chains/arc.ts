import type { Chain } from "viem";
import { arcChainId, arcExplorerUrl, arcRpcUrl } from "@/lib/arc-config";

export const arcTestnet = {
  id: arcChainId,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [arcRpcUrl],
    },
    public: {
      http: [arcRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: arcExplorerUrl,
    },
  },
} as const satisfies Chain;
