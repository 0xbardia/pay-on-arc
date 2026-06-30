"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  label: string;
  revenue: number;
  transactions?: number;
};

export function RevenueChart({
  data,
  series = "revenue",
}: {
  data: RevenuePoint[];
  series?: "revenue" | "transactions";
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-white/10 bg-slate-950/40 text-sm text-slate-400">
        Revenue chart appears after payments are recorded.
      </div>
    );
  }

  const isTransactions = series === "transactions";
  const dataKey = isTransactions ? "transactions" : "revenue";
  const stroke = isTransactions ? "#22C55E" : "#7C3AED";
  const gradientId = isTransactions ? "transactionsFill" : "revenueFill";

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="transactionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
