import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  ACTIVE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  PAID: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  CONFIRMED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  SIMULATED: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  FAILED: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  DISABLED: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  EXPIRED: "border-slate-500/20 bg-slate-500/10 text-slate-300",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status] ?? "border-white/10 bg-white/5 text-slate-300",
        className,
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
