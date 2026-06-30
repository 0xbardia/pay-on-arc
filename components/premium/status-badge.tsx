import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  ACTIVE: "border-success/20 bg-success/10 text-success",
  PAID: "border-success/20 bg-success/10 text-success",
  CONFIRMED: "border-success/20 bg-success/10 text-success",
  PENDING: "border-warning/20 bg-warning/10 text-warning",
  SIMULATED: "border-primary/20 bg-primary/10 text-primary",
  FAILED: "border-danger/20 bg-danger/10 text-danger",
  DISABLED: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  EXPIRED: "border-slate-500/20 bg-slate-500/10 text-slate-300",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-4",
        styles[status] ?? "border-white/10 bg-white/5 text-slate-300",
        className,
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
