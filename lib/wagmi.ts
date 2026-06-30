"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  braveWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { arcTestnet } from "@/lib/chains/arc";
import {
  arbitrumMainnet,
  baseMainnet,
  ethereumMainnet,
  optimismMainnet,
  polygonMainnet,
} from "@/lib/chains/evm";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "arcpay-walletconnect-placeholder";
export const isWalletConnectConfigured = Boolean(process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID);

if (!isWalletConnectConfigured && typeof window !== "undefined") {
  console.warn(
    "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not configured. WalletConnect wallets may not work, but injected wallets like Rabby and MetaMask remain available.",
  );
}

const appName = "Pay On Arc";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet, coinbaseWallet, trustWallet, okxWallet, braveWallet],
    },
    {
      groupName: "More EVM wallets",
      wallets: [walletConnectWallet, rainbowWallet],
    },
  ],
  {
    appName,
    projectId: walletConnectProjectId,
    appDescription: "AI-powered stablecoin payment dashboard for Arc.",
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  },
);

export const wagmiConfig = createConfig({
  chains: [arcTestnet, ethereumMainnet, baseMainnet, polygonMainnet, optimismMainnet, arbitrumMainnet],
  connectors,
  ssr: true,
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
    [ethereumMainnet.id]: http(ethereumMainnet.rpcUrls.default.http[0]),
    [baseMainnet.id]: http(baseMainnet.rpcUrls.default.http[0]),
    [polygonMainnet.id]: http(polygonMainnet.rpcUrls.default.http[0]),
    [optimismMainnet.id]: http(optimismMainnet.rpcUrls.default.http[0]),
    [arbitrumMainnet.id]: http(arbitrumMainnet.rpcUrls.default.http[0]),
  },
});
