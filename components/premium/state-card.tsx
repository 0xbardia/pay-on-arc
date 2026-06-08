import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-elevated/60 p-5">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="mt-4 h-8 w-32" />
      <LoadingSkeleton className="mt-4 h-3 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-elevated/60 p-5">
      <LoadingSkeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-elevated/60 p-5">
      <LoadingSkeleton className="h-5 w-32" />
      <LoadingSkeleton className="mt-5 h-72 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartSkeleton />
        <TableSkeleton rows={3} />
      </div>
    </div>
  );
}

export function CopilotSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <ChartSkeleton />
    </div>
  );
}

export function SuccessState({ title, description, footer }: { title: string; description: string; footer?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
      <CheckCircle2 className="h-8 w-8 text-emerald-300" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-emerald-100/80">{description}</p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-100">
      <AlertCircle className="h-6 w-6 text-rose-300" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-rose-100/80">{description}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
      <Loader2 className="h-4 w-4 animate-spin text-violet-300" aria-hidden="true" />
      {label}
    </div>
  );
}
