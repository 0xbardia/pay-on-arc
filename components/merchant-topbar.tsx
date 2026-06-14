"use client";

import { LogOut, Search, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet";
}

export function MerchantTopbar() {
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
    <header className="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-[#0B0F19]/70 px-4 py-3 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
        <input
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-border bg-white/[0.03] pl-9 pr-3 text-sm text-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          disabled
          placeholder="Search payments, links, transactions..."
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-slate-200">
          {chain?.name ?? "Arc Testnet"}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          {shortAddress(address)}
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-300">
          ● {isConnected ? "Connected" : "Disconnected"}
        </div>
        <Button aria-label="Disconnect wallet" onClick={handleDisconnect} size="icon" type="button" variant="ghost">
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
