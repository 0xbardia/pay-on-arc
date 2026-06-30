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

    // Only validate on address change - middleware + AppLayout already validated
    // the session on page load. This prevents redundant /api/auth/me calls.
    validatedAddress.current = normalizedAddress;
  }, [isConnected, normalizedAddress, pathname, router, status]);

  return children;
}

export const AppWalletGuard = memo(AppWalletGuardComponent);
