"use client";

import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { logClientError } from "@/lib/client-log";

function AppWalletGuardComponent({ children }: { children: React.ReactNode }) {
  const { address, isConnected, status } = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const isRedirecting = useRef(false);
  const validatedAddress = useRef<string | null>(null);
  const normalizedAddress = address?.toLowerCase() ?? null;

  useEffect(() => {
    if (
      !isConnected ||
      !normalizedAddress ||
      status === "reconnecting" ||
      isRedirecting.current ||
      validatedAddress.current === normalizedAddress ||
      !pathname.startsWith("/app")
    ) {
      return;
    }

    fetch(`/api/auth/me?address=${encodeURIComponent(normalizedAddress)}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Session is missing, expired, or does not match the connected wallet.");
        }

        validatedAddress.current = normalizedAddress;
      })
      .catch((error) => {
        logClientError("Session validation failed", error);
        isRedirecting.current = true;
        fetch("/api/auth/logout", { method: "POST" })
          .catch((logoutError) => {
            logClientError("Session logout after validation failure failed", logoutError);
          })
          .finally(() => {
            router.replace("/");
          });
      });
  }, [isConnected, normalizedAddress, pathname, router, status]);

  return children;
}

export const AppWalletGuard = memo(AppWalletGuardComponent);
