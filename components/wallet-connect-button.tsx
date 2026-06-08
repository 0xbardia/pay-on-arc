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

type NonceResponse = {
  nonce?: string;
  domain?: string;
  issuedAt?: string;
};

type AuthResponseError = {
  error?: string;
  message?: string;
};

type AuthStatus = "idle" | "signing" | "authenticated" | "error";

const walletResponseTimeoutMs = 45_000;
const networkTimeoutMs = 12_000;

let authenticatedAddress: string | null = null;
let authInFlightAddress: string | null = null;
let failedAutoAuthAddress: string | null = null;
let authInFlightPromise: Promise<void> | null = null;
let isLoggingOut = false;
let logoutInFlight: Promise<void> | null = null;

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isLikelySignatureRejected(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /reject|denied|cancel|user rejected|user denied/i.test(error.message);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function createTimeoutError(message: string) {
  return new Error(message);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      cache: "no-store",
      ...init,
      signal: controller.signal,
    });
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
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  });
}

function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

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
  const authRunId = useRef(0);
  const previousAddress = useRef<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [chainError, setChainError] = useState<string | null>(null);
  const [authAttemptVersion, setAuthAttemptVersion] = useState(0);

  const normalizedAddress = address?.toLowerCase() ?? null;
  const isSigning = authStatus === "signing";
  const isOnArcTestnet = chain?.id === arcTestnet.id;

  const clearLocalAuthState = useCallback(() => {
    authRunId.current += 1;
    authenticatedAddress = null;
    authInFlightAddress = null;
    failedAutoAuthAddress = null;
    setAuthStatus("idle");
    setAuthError(null);
  }, []);

  const logoutServerSession = useCallback(async () => {
    if (!logoutInFlight) {
      isLoggingOut = true;
      logoutInFlight = fetchWithTimeout("/api/auth/logout", { method: "POST" }, networkTimeoutMs)
        .catch((error) => {
          logClientError("Wallet logout request failed", error);
        })
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

  const authenticateWallet = useCallback(
    async ({ userInitiated = false }: { userInitiated?: boolean } = {}) => {
      if (!isConnected) {
        setAuthError("Wallet is not connected.");
        return;
      }

      if (isLoggingOut) {
        return;
      }

      if (!normalizedAddress) {
        setAuthError("Connected wallet address is missing.");
        return;
      }

      if (!connector) {
        setAuthError("Wallet connector is not ready yet.");
        return;
      }

      if (authStatus === "signing" || authInFlightAddress === normalizedAddress) {
        if (authInFlightPromise) {
          await authInFlightPromise;
        }
        return;
      }

      if (authenticatedAddress === normalizedAddress) {
        authenticatedAddress = normalizedAddress;
        setAuthStatus("authenticated");
        setAuthError(null);
        return;
      }

      if (!userInitiated && failedAutoAuthAddress === normalizedAddress) {
        return;
      }

      const existingSession = await fetchWithTimeout(
        `/api/auth/me?address=${encodeURIComponent(normalizedAddress)}`,
        undefined,
        networkTimeoutMs,
      ).catch(() => null);

      if (existingSession?.ok) {
        authenticatedAddress = normalizedAddress;
        failedAutoAuthAddress = null;
        setAuthStatus("authenticated");
        setAuthError(null);
        const destination = userInitiated ? authenticatedHref ?? redirectOnAuth ?? "/app/dashboard" : redirectOnAuth ?? "/app/dashboard";

        if (userInitiated) {
          router.push(destination);
        } else {
          router.replace(destination);
        }

        return;
      }

      const runId = authRunId.current + 1;
      authRunId.current = runId;
      authInFlightAddress = normalizedAddress;
      setAuthStatus("signing");
      setAuthError(null);

      const authFlow = (async () => {
        const nonceResponse = await fetchWithTimeout("/api/auth/nonce", undefined, networkTimeoutMs).catch((error) => {
          logClientError("Wallet nonce request failed", error);
          throw new Error("Could not create a wallet login nonce.");
        });

        if (!nonceResponse.ok) {
          logClientError("Wallet nonce request returned an error", {
            status: nonceResponse.status,
            statusText: nonceResponse.statusText,
          });
          throw new Error("Could not create a wallet login nonce.");
        }

        const { nonce, domain, issuedAt } = (await nonceResponse.json()) as NonceResponse;

        if (!nonce || !domain || !issuedAt) {
          logClientError("Wallet nonce response did not include a nonce");
          throw new Error("Wallet login nonce was missing.");
        }

        let message: string;

        try {
          message = buildWalletLoginMessage({ address: normalizedAddress, nonce, domain, issuedAt, chainId: chain?.id });
        } catch (error) {
          logClientError("Wallet login message creation failed", error);
          throw new Error("Could not create the wallet login message.");
        }

        let signature: string;

        try {
          signature = await withTimeout(
            signMessageAsync({ message }),
            walletResponseTimeoutMs,
            "Wallet did not respond to the signature request.",
          );
        } catch (error) {
          logClientError("Wallet signature request failed", error);
          throw new Error(isLikelySignatureRejected(error) ? "Signature rejected" : getErrorMessage(error, "Signature failed"));
        }

        if (authRunId.current !== runId) {
          return;
        }

        const authResponse = await fetchWithTimeout(
          "/api/auth/wallet",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: normalizedAddress,
              signature,
              message,
              chainId: chain?.id,
              connectorName: connector.name,
            }),
          },
          networkTimeoutMs,
        ).catch((error) => {
          logClientError("Wallet auth request failed", error);
          throw new Error("Could not complete wallet login.");
        });

        if (!authResponse.ok) {
          const payload = (await authResponse.json().catch(() => null)) as AuthResponseError | null;
          logClientError("Wallet auth request returned an error", {
            status: authResponse.status,
            statusText: authResponse.statusText,
            error: payload?.error,
          });
          throw new Error(payload?.message ?? payload?.error ?? "Wallet signature could not be authenticated.");
        }

        const refreshedSession = await fetchWithTimeout(
          `/api/auth/me?address=${encodeURIComponent(normalizedAddress)}`,
          undefined,
          networkTimeoutMs,
        ).catch((error) => {
          logClientError("Wallet session refresh failed", error);
          throw new Error("Wallet login succeeded, but session refresh failed.");
        });

        if (!refreshedSession.ok) {
          logClientError("Wallet session refresh returned an error", {
            status: refreshedSession.status,
            statusText: refreshedSession.statusText,
          });
          throw new Error("Wallet login succeeded, but session refresh failed.");
        }

        const refreshedPayload = (await refreshedSession.json().catch(() => null)) as
          | { wallet?: { address?: string } }
          | null;

        if (refreshedPayload?.wallet?.address !== normalizedAddress) {
          logClientError("Wallet session refresh returned a mismatched address", refreshedPayload);
          throw new Error("Wallet login succeeded, but session address did not match.");
        }

        authenticatedAddress = normalizedAddress;
        failedAutoAuthAddress = null;
        setAuthStatus("authenticated");
        router.replace(redirectOnAuth ?? "/app/dashboard");
      })();
      authInFlightPromise = authFlow;

      try {
        await authFlow;
      } catch (error) {
        logClientError("Wallet authentication failed", error);

        if (authRunId.current === runId) {
          authenticatedAddress = null;

          if (!userInitiated) {
            failedAutoAuthAddress = normalizedAddress;
          }

          setAuthError(getErrorMessage(error, "Wallet login was not completed."));
          setAuthStatus("error");
        }
      } finally {
        if (authRunId.current === runId) {
          authInFlightAddress = null;
          authInFlightPromise = null;
          setAuthStatus((current) => (current === "signing" ? "idle" : current));
        }
      }
    },
    [
      authStatus,
      authenticatedHref,
      chain?.id,
      connector,
      isConnected,
      normalizedAddress,
      redirectOnAuth,
      router,
      signMessageAsync,
    ],
  );

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

      const provider = await connector.getProvider().catch((providerError) => {
        logClientError("Could not get wallet provider for Arc Testnet add-chain request", providerError);
        return null;
      });

      if (!provider || typeof provider !== "object" || !("request" in provider)) {
        setChainError("This wallet connector cannot add Arc Testnet automatically.");
        setIsSwitchingChain(false);
        return;
      }

      const request = (provider as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }).request;

      try {
        await request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: toHexChainId(arcTestnet.id),
              chainName: arcTestnet.name,
              nativeCurrency: arcTestnet.nativeCurrency,
              rpcUrls: [...arcTestnet.rpcUrls.default.http],
              blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
            },
          ],
        });
        await switchChainAsync({ chainId: arcTestnet.id }).catch(() => undefined);
      } catch (addError) {
        logClientError("Add Arc Testnet request failed", addError);
        setChainError(
          isLikelySignatureRejected(addError)
            ? "Network switch rejected"
            : "Could not add or switch to Arc Testnet.",
        );
      }
    } finally {
      setIsSwitchingChain(false);
    }
  }, [connector, isConnected, switchChainAsync]);

  useEffect(() => {
    const hadAddress = Boolean(previousAddress.current);
    const addressChanged =
      Boolean(previousAddress.current && normalizedAddress && previousAddress.current !== normalizedAddress);
    const disconnectedExternally = hadAddress && (!isConnected || !normalizedAddress);

    if (addressChanged) {
      clearLocalAuthState();
      const switchedAddress = normalizedAddress;
      void logoutServerSession().finally(() => {
        if (switchedAddress === normalizedAddress) {
          setAuthAttemptVersion((current) => current + 1);
        }
      });
    }

    if (disconnectedExternally) {
      void logoutAndRedirectHome();
    }

    previousAddress.current = normalizedAddress;
  }, [clearLocalAuthState, isConnected, logoutAndRedirectHome, logoutServerSession, normalizedAddress]);

  useEffect(() => {
    if (status === "connecting" || status === "reconnecting" || !isConnected || !normalizedAddress || !connector) {
      return;
    }

    if (!previousAddress.current) {
      isLoggingOut = false;
    }

    if (isLoggingOut) {
      return;
    }

    void authenticateWallet();
  }, [authAttemptVersion, authenticateWallet, connector, isConnected, normalizedAddress, status]);

  async function handleDisconnect() {
    clearLocalAuthState();
    setChainError(null);
    await logoutServerSession();
    disconnect();
    router.replace("/");
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain: connectedChain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && connectedChain;
        const isAuthenticatedForConnectedWallet =
          authStatus === "authenticated" && authenticatedAddress === account?.address.toLowerCase();

        if (!connected) {
          return (
            <Button onClick={openConnectModal} type="button">
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
            {!isOnArcTestnet ? (
              <Button disabled={isSwitchingChain} onClick={() => void switchToArcTestnet()} type="button" variant="outline">
              {isSwitchingChain ? "Switching..." : "Switch to Arc Testnet"}
              </Button>
            ) : null}
            <Button
              disabled={isSigning}
              onClick={() => {
                if (isAuthenticatedForConnectedWallet) {
                  if (authenticatedHref) {
                    router.push(authenticatedHref);
                    return;
                  }

                  openAccountModal();
                  return;
                }

                void authenticateWallet({ userInitiated: true });
              }}
              type="button"
              variant="secondary"
            >
              {isSigning
                ? "Signing..."
                : isAuthenticatedForConnectedWallet
                  ? authenticatedLabel ?? shortAddress(account.address)
                  : authError
                    ? "Retry signing"
                    : signLabel}
            </Button>
            <Button
              aria-label="Disconnect wallet"
              disabled={isSigning}
              onClick={handleDisconnect}
              size="icon"
              type="button"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
            {!isWalletConnectConfigured ? (
              <p className="basis-full text-xs text-amber-300">
                WalletConnect project ID is missing. Injected wallets still work.
              </p>
            ) : null}
            {!isOnArcTestnet ? (
              <p className="basis-full text-xs text-amber-300">
                Pay On Arc is built for Arc Testnet. Switch networks before using payment workflows.
              </p>
            ) : null}
            {chainError ? <p className="basis-full text-xs text-rose-300">{chainError}</p> : null}
            {authError ? <p className="basis-full text-xs text-rose-300">{authError}</p> : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export const WalletConnectButton = memo(WalletConnectButtonComponent);
