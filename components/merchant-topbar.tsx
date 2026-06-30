"use client";

import { LogOut, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet";
}

function getPageName(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // /app/dashboard → Dashboard, /app/payments → Payments, etc.
  const page = segments[segments.length - 1] ?? "";
  return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, " ");
}

export function MerchantTopbar() {
  const pathname = usePathname();
  const { address, chain, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { notify } = useToast();

  async function handleDisconnect() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    notify({ type: "info", title: "Wallet disconnected" });
    disconnect();
    router.replace("/");
  }

  return (
    <header className="mb-6 flex items-center justify-between rounded-xl border border-border bg-[#0B0F19]/70 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-starlight">{getPageName(pathname)}</span>
        <span className="hidden h-4 w-px bg-border sm:block" />
        <span className="hidden text-xs text-silver sm:block">
          {chain?.name ?? "Arc Testnet"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Wallet className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="text-xs font-medium text-starlight">{shortAddress(address)}</span>
          <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-success" : "bg-slate-500"}`} />
        </div>
        <Button
          aria-label="Disconnect wallet"
          onClick={handleDisconnect}
          size="icon"
          type="button"
          variant="ghost"
          className="h-8 w-8"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}