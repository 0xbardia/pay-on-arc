"use client";

import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/premium/revenue-chart").then((module) => module.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-white/10 bg-slate-950/40 text-sm text-slate-400">
        Loading revenue chart...
      </div>
    ),
  },
);

export function RevenueChartLoader({
  data,
  series,
}: {
  data: Array<{ label: string; revenue: number; transactions?: number }>;
  series?: "revenue" | "transactions";
}) {
  return <RevenueChart data={data} series={series} />;
}
