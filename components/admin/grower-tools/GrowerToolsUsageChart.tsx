"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function GrowerToolsUsageChart({
  data,
}: {
  data: { date: string; calls: number; usd: number }[];
}) {
  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">ไม่มีข้อมูลในช่วงนี้</p>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis yAxisId="calls" tick={{ fontSize: 11 }} width={32} />
          <YAxis
            yAxisId="usd"
            orientation="right"
            tick={{ fontSize: 11 }}
            width={40}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "usd"
                ? [`$${Number(value).toFixed(4)}`, "USD"]
                : [value, "Calls"]
            }
          />
          <Bar yAxisId="calls" dataKey="calls" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="usd" dataKey="usd" fill="#ca8a04" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
