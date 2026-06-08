import type { LucideIcon } from "lucide-react";

export function TimelineItem({
  icon: Icon,
  title,
  description,
  meta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <div className="relative flex gap-3 rounded-lg border border-border bg-white/[0.03] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
      </div>
    </div>
  );
}
