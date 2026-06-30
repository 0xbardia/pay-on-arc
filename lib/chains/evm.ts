import type { Chain } from "viem";

export const ethereumMainnet = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://eth.merkle.io"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
} as const satisfies Chain;

export const baseMainnet = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
} as const satisfies Chain;

export const polygonMainnet = {
  id: 137,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
  blockExplorers: { default: { name: "Polygonscan", url: "https://polygonscan.com" } },
} as const satisfies Chain;

export const optimismMainnet = {
  id: 10,
  name: "OP Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.optimism.io"] } },
  blockExplorers: { default: { name: "Optimism Explorer", url: "https://optimistic.etherscan.io" } },
} as const satisfies Chain;

export const arbitrumMainnet = {
  id: 42161,
  name: "Arbitrum One",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://arbiscan.io" } },
} as const satisfies Chain;
