import { WalletConnectButton } from "@/components/wallet-connect-button";

export function AppHeader() {
  return (
    <header className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-elevated/40 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-300">Wallet session</p>
        <p className="mt-1 text-sm text-slate-400">Authenticated merchant workspace on Arc Testnet.</p>
      </div>
      <WalletConnectButton />
    </header>
  );
}
