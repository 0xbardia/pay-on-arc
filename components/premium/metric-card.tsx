import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/premium/animated-counter";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  numericValue,
  prefix,
  suffix,
  description,
  trend,
  icon: Icon,
}: {
  title: string;
  value?: string | number;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
  description: string;
  trend?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="group overflow-hidden bg-elevated/70 transition-all hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-premium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-3 text-3xl font-bold text-white">
              {numericValue !== undefined ? (
                <AnimatedCounter value={numericValue} prefix={prefix} suffix={suffix} decimals={prefix === "$" ? 2 : 0} />
              ) : (
                value
              )}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-violet-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{description}</p>
          {trend ? <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">{trend}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
