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
    <Card className="bg-elevated/70 transition-colors hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-silver">{title}</p>
            <p className="mt-2 text-3xl font-bold text-starlight">
              {numericValue !== undefined ? (
                <AnimatedCounter value={numericValue} prefix={prefix} suffix={suffix} decimals={prefix === "$" ? 2 : 0} />
              ) : (
                value
              )}
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-border bg-white/[0.04] p-2 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-silver">{description}</p>
          {trend ? <span className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">{trend}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
