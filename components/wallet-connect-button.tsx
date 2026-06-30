"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogOut, Wallet } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { buildWalletLoginMessage } from "@/lib/auth-message";
import { arcTestnet } from "@/lib/chains/arc";
import { logClientError } from "@/lib/client-log";
import { isWalletConnectConfigured } from "@/lib/wagmi";

type WalletConnectButtonProps = {
  authenticatedHref?: string;
  authenticatedLabel?: string;
  connectLabel?: string;
  redirectOnAuth?: string;
  signLabel?: string;
};

type NonceResponse = { nonce?: string; domain?: string; issuedAt?: string };
type AuthResponseError = { error?: string; message?: string };
type AuthStatus = "idle" | "signing" | "authenticated" | "error";

const walletResponseTimeoutMs = 45_000;
const networkTimeoutMs = 12_000;

/* Module-level guards — shared across all instances */
let authenticatedAddress: string | null = null;
let authInFlightAddress: string | null = null;
let failedAutoAuthAddress: string | null = null;
let authInFlightPromise: Promise<void> | null = null;
let isLoggingOut = false;
let logoutInFlight: Promise<void> | null = null;

/* Track recently successful sessions to prevent duplicate auth */
const recentAuthSuccess = new Map<string, number>(); // address -> timestamp

/* GLOBAL AUTH LOCK — single auth flow per address+chain at a time */
let globalAuthInFlight: Promise<void> | null = null;
let lastSuccessfulAuthKey: string | null = null;

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isLikelySignatureRejected(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /reject|denied|cancel|user rejected|user denied/i.test(error.message);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function createTimeoutError(message: string) {
  return new Error(message);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { cache: "no-store", ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(createTimeoutError(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
  });
}

function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

/* ──────────────────────────────────────────────────
   Core auth flow — single, shared, guarded
   ────────────────────────────────────────────────── */

async function ensureWalletSession({
  address,
  chainId,
  connector,
  signMessageAsync,
  router,
  redirectOnAuth,
  authenticatedHref,
  explicitUserAction = false,
  onStatusChange,
}: {
  address: string;
  chainId?: number;
  connector: { name: string };
  signMessageAsync: (args: { message: string }) => Promise<string>;
  router: ReturnType<typeof useRouter>;
  redirectOnAuth?: string;
  authenticatedHref?: string;
  explicitUserAction?: boolean;
  onStatusChange?: (status: AuthStatus, error?: string | null) => void;
}): Promise<void> {
  const normalized = address.toLowerCase();
  const now = Date.now();
  const authKey = `${normalized}:${chainId ?? "unknown"}`;

  /* ── Guard: recently authenticated (within 30s) ── */
  const recentAuth = recentAuthSuccess.get(normalized);
  if (recentAuth && now - recentAuth < 30_000) {
    onStatusChange?.("authenticated");
    return;
  }

  /* ── Guard: global successful auth key matches ── */
  if (lastSuccessfulAuthKey === authKey) {
    onStatusChange?.("authenticated");
    return;
  }

  /* ── Guard: already authenticated ── */
  if (authenticatedAddress === normalized) {
    onStatusChange?.("authenticated");
    return;
  }

  /* ── Guard: global auth in flight ── */
  if (globalAuthInFlight) {
    await globalAuthInFlight;
    return;
  }

  /* ── Guard: auth already in flight for this address ── */
  if (authInFlightAddress === normalized && authInFlightPromise) {
    await authInFlightPromise;
    return;
  }

  /* ── Guard: previously failed auto-auth for this address ── */
  if (!explicitUserAction && failedAutoAuthAddress === normalized) {
    return;
  }

  /* ── Lock: set BEFORE any async call to prevent race ── */
  authInFlightAddress = normalized;

  globalAuthInFlight = (async () => {
    try {
      authInFlightPromise = (async () => {
        try {
          onStatusChange?.("signing");

          /* ── Check existing session FIRST ── */
          try {
            const meRes = await fetchWithTimeout(
              `/api/auth/me?address=${encodeURIComponent(normalized)}`,
              undefined,
              networkTimeoutMs,
            );

            if (meRes.ok) {
              authenticatedAddress = normalized;
              failedAutoAuthAddress = null;
              recentAuthSuccess.set(normalized, now);
              lastSuccessfulAuthKey = authKey;
              onStatusChange?.("authenticated");
              const dest = explicitUserAction ? (authenticatedHref ?? redirectOnAuth ?? "/app/dashboard") : (redirectOnAuth ?? "/app/dashboard");
              if (explicitUserAction) {
                router.push(dest);
              } else {
                router.replace(dest);
              }
              return;
            }
          } catch {
            /* session check failed — proceed to sign */
          }

          /* ── Only sign on explicit user action ── */
          if (!explicitUserAction) {
            failedAutoAuthAddress = normalized;
            onStatusChange?.("idle");
            return;
          }

          /* ── Fetch nonce ── */
          let nonceResponse: Response;
          try {
            nonceResponse = await fetchWithTimeout("/api/auth/nonce", undefined, networkTimeoutMs);
          } catch {
            onStatusChange?.("error", "Could not create a wallet login nonce.");
            return;
          }

          if (!nonceResponse.ok) {
            onStatusChange?.("error", "Could not create a wallet login nonce.");
            return;
          }

          let nonce: string, domain: string, issuedAt: string;
          try {
            const body = (await nonceResponse.json()) as NonceResponse;
            if (!body.nonce || !body.domain || !body.issuedAt) throw new Error();
            nonce = body.nonce;
            domain = body.domain;
            issuedAt = body.issuedAt;
          } catch {
            onStatusChange?.("error", "Wallet login nonce was missing.");
            return;
          }

          /* ── Build message ── */
          let message: string;
          try {
            message = buildWalletLoginMessage({ address: normalized, nonce, domain, issuedAt, chainId });
          } catch {
            onStatusChange?.("error", "Could not create the wallet login message.");
            return;
          }

          /* ── Request signature (only once) ── */
          let signature: string;
          try {
            signature = await withTimeout(
              signMessageAsync({ message }),
              walletResponseTimeoutMs,
              "Wallet did not respond to the signature request.",
            );
          } catch (error) {
            const msg = isLikelySignatureRejected(error) ? "Signature rejected" : getErrorMessage(error, "Signature failed");
            onStatusChange?.("error", msg);
            return;
          }

          /* ── Send signature to server ── */
          let authResponse: Response;
          try {
            authResponse = await fetchWithTimeout(
              "/api/auth/wallet",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: normalized, signature, message, chainId, connectorName: connector.name }),
              },
              networkTimeoutMs,
            );
          } catch {
            onStatusChange?.("error", "Could not complete wallet login.");
            return;
          }

          if (!authResponse.ok) {
            let payload: AuthResponseError | null = null;
            try { payload = await authResponse.json(); } catch { /* ignore */ }
            onStatusChange?.("error", payload?.message ?? payload?.error ?? "Wallet signature could not be authenticated.");
            return;
          }

          /* ── Verify session ── */
          try {
            const refreshRes = await fetchWithTimeout(
              `/api/auth/me?address=${encodeURIComponent(normalized)}`,
              undefined,
              networkTimeoutMs,
            );
            if (!refreshRes.ok) throw new Error();
            const payload = await refreshRes.json() as { wallet?: { address?: string } } | null;
            if (!payload?.wallet?.address || payload.wallet.address.toLowerCase() !== normalized) throw new Error();
          } catch {
            onStatusChange?.("error", "Wallet login succeeded, but session refresh failed.");
            return;
          }

          /* ── Success ── */
          authenticatedAddress = normalized;
          failedAutoAuthAddress = null;
          recentAuthSuccess.set(normalized, now);
          lastSuccessfulAuthKey = authKey;
          onStatusChange?.("authenticated");
          router.replace(redirectOnAuth ?? "/app/dashboard");
        } finally {
          authInFlightAddress = null;
          authInFlightPromise = null;
        }
      })();
      await authInFlightPromise;
    } finally {
      globalAuthInFlight = null;
    }
  })();
  await globalAuthInFlight;
}

/* ──────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────── */

function WalletConnectButtonComponent({
  authenticatedHref,
  authenticatedLabel,
  connectLabel = "Connect wallet",
  redirectOnAuth,
  signLabel = "Sign message",
}: WalletConnectButtonProps) {
  const { address, chain, connector, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const pathname = usePathname();
  const router = useRouter();

  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [chainError, setChainError] = useState<string | null>(null);

  /* Ref-based guard: only attempt auto-auth once per mount */
  const autoAuthAttempted = useRef(false);
  const previousAddress = useRef<string | null>(null);
  const pendingAuthAfterConnect = useRef(false);

  const normalizedAddress = address?.toLowerCase() ?? null;
  const isSigning = authStatus === "signing";
  const isOnArcTestnet = chain?.id === arcTestnet.id;

  const onStatusChange = useCallback((status: AuthStatus, error?: string | null) => {
    setAuthStatus(status);
    setAuthError(error ?? null);
  }, []);

  const clearLocalAuthState = useCallback(() => {
    authenticatedAddress = null;
    authInFlightAddress = null;
    failedAutoAuthAddress = null;
    recentAuthSuccess.clear();
    setAuthStatus("idle");
    setAuthError(null);
  }, []);

  const logoutServerSession = useCallback(async () => {
    if (!logoutInFlight) {
      isLoggingOut = true;
      logoutInFlight = fetchWithTimeout("/api/auth/logout", { method: "POST" }, networkTimeoutMs)
        .catch(() => undefined)
        .then(() => undefined)
        .finally(() => {
          logoutInFlight = null;
          isLoggingOut = false;
        });
    }
    await logoutInFlight;
  }, []);

  const logoutAndRedirectHome = useCallback(async () => {
    clearLocalAuthState();
    setChainError(null);
    await logoutServerSession();
    if (pathname.startsWith("/app")) {
      router.replace("/");
    }
  }, [clearLocalAuthState, logoutServerSession, pathname, router]);

  const handleSignIn = useCallback(async () => {
    if (!normalizedAddress || !connector) return;
    await ensureWalletSession({
      address: normalizedAddress,
      chainId: chain?.id,
      connector,
      signMessageAsync,
      router,
      redirectOnAuth,
      authenticatedHref,
      explicitUserAction: true,
      onStatusChange,
    });
  }, [normalizedAddress, chain?.id, connector, signMessageAsync, router, redirectOnAuth, authenticatedHref, onStatusChange]);

  /* ── Detect external disconnection ── */
  useEffect(() => {
    const hadAddress = Boolean(previousAddress.current);
    const addressChanged = Boolean(previousAddress.current && normalizedAddress && previousAddress.current !== normalizedAddress);
    const disconnectedExternally = hadAddress && (!isConnected || !normalizedAddress);

    if (addressChanged) {
      clearLocalAuthState();
      const switchedAddress = normalizedAddress;
      void logoutServerSession().finally(() => {
        /* allow new auth after address switch */
        if (switchedAddress === normalizedAddress) {
          autoAuthAttempted.current = false;
        }
      });
    }

    if (disconnectedExternally) {
      void logoutAndRedirectHome();
    }

    previousAddress.current = normalizedAddress;
  }, [clearLocalAuthState, isConnected, logoutAndRedirectHome, logoutServerSession, normalizedAddress]);

  /* ── Auto-auth on wallet connect or page load (only on landing page) ── */
  useEffect(() => {
    // Don't auto-auth on app routes — middleware + AppLayout already validated session
    if (pathname.startsWith("/app")) return;
    if (autoAuthAttempted.current && !pendingAuthAfterConnect.current) return;
    if (status === "connecting" || status === "reconnecting" || !isConnected || !normalizedAddress || !connector) return;
    if (isLoggingOut) return;

    // One-click flow: user clicked Connect Wallet → wallet connected → trigger auth
    const wasUserInitiated = pendingAuthAfterConnect.current;
    pendingAuthAfterConnect.current = false;
    autoAuthAttempted.current = true;

    void ensureWalletSession({
      address: normalizedAddress,
      chainId: chain?.id,
      connector,
      signMessageAsync,
      router,
      redirectOnAuth,
      authenticatedHref,
      explicitUserAction: wasUserInitiated,
      onStatusChange,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAuthAttempted, connector, isConnected, normalizedAddress, status, pathname]);

  async function handleDisconnect() {
    clearLocalAuthState();
    setChainError(null);
    await logoutServerSession();
    disconnect();
    router.replace("/");
  }

  const switchToArcTestnet = useCallback(async () => {
    if (!isConnected || !connector) {
      setChainError("Connect a wallet before switching networks.");
      return;
    }
    setIsSwitchingChain(true);
    setChainError(null);
    try {
      await switchChainAsync({ chainId: arcTestnet.id });
    } catch (switchError) {
      logClientError("Switch to Arc Testnet failed; attempting to add chain", switchError);
      const provider = await connector.getProvider().catch(() => null);
      if (!provider || typeof provider !== "object" || !("request" in provider)) {
        setChainError("This wallet connector cannot add Arc Testnet automatically.");
        setIsSwitchingChain(false);
        return;
      }
      const req = (provider as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }).request;
      try {
        await req({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: toHexChainId(arcTestnet.id),
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: [...arcTestnet.rpcUrls.default.http],
            blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
          }],
        });
        await switchChainAsync({ chainId: arcTestnet.id }).catch(() => undefined);
      } catch (addError) {
        logClientError("Add Arc Testnet request failed", addError);
        setChainError(isLikelySignatureRejected(addError) ? "Network switch rejected" : "Could not add or switch to Arc Testnet.");
      }
    } finally {
      setIsSwitchingChain(false);
    }
  }, [connector, isConnected, switchChainAsync]);

  return (
    <ConnectButton.Custom>
      {({ account, chain: connectedChain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && connectedChain;
        const isAuthenticatedForConnectedWallet = authStatus === "authenticated" && authenticatedAddress === account?.address.toLowerCase();

        if (!connected) {
          return (
            <Button onClick={() => { pendingAuthAfterConnect.current = true; openConnectModal(); }} type="button">
              <Wallet className="h-4 w-4" aria-hidden="true" />
              {connectLabel}
            </Button>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openChainModal} type="button" variant="outline">
              {connectedChain.hasIcon && connectedChain.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-4 w-4 rounded-full" src={connectedChain.iconUrl} />
              ) : null}
              {connectedChain.name}
            </Button>

            {isAuthenticatedForConnectedWallet ? (
              <Button onClick={openAccountModal} type="button" variant="outline">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                {shortAddress(account.address)}
              </Button>
            ) : isSigning ? (
              <Button disabled type="button">
                Signing...
              </Button>
            ) : (
              <Button onClick={handleSignIn} type="button">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                {signLabel}
              </Button>
            )}

            {authError ? (
              <p className="text-xs text-danger max-w-48 truncate">{authError}</p>
            ) : null}

            <Button aria-label="Disconnect wallet" onClick={handleDisconnect} size="icon" type="button" variant="ghost">
              {isLoggingOut ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-silver border-t-transparent" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export const WalletConnectButton = memo(WalletConnectButtonComponent);