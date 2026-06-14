import "server-only";

import { getAuthenticatedUser } from "@/lib/auth";

export function getAdminPanelPath() {
  const configuredPath = process.env.ADMIN_PANEL_PATH?.trim() || "/secure-admin";
  const normalizedPath = configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`;

  return normalizedPath.replace(/\/+$/, "") || "/secure-admin";
}

export function getAdminWalletAllowlist() {
  return new Set(
    (process.env.ADMIN_WALLETS ?? "")
      .split(",")
      .map((wallet) => wallet.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminWallet(address?: string | null) {
  if (!address) {
    return false;
  }

  return getAdminWalletAllowlist().has(address.toLowerCase());
}

export async function getAdminUser() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { auth: null, isAdmin: false };
  }

  return {
    auth,
    isAdmin: isAdminWallet(auth.wallet.address),
  };
}
