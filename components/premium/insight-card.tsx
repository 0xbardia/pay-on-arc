import type { LucideIcon } from "lucide-react";

export function InsightCard({
  icon: Icon,
  title,
  children,
  tone = "violet",
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  tone?: "violet" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-400/10 text-emerald-200"
      : tone === "amber"
        ? "bg-amber-400/10 text-amber-200"
        : "bg-violet-400/10 text-violet-200";

  return (
    <div className="rounded-xl border border-border bg-white/[0.03] p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}
