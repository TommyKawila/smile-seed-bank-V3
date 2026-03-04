"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ChannelBreakdown } from "@/services/dashboard-service";

interface ChannelPieChartProps {
  data: ChannelBreakdown[];
}

const COLORS = { WEB: "#15803d", MANUAL: "#86efac" };
const LABELS = { WEB: "B2C (เว็บ)", MANUAL: "B2B / Manual" };

const formatBaht = (value: number) =>
  `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;

export function ChannelPieChart({ data }: ChannelPieChartProps) {
  const chartData = data.map((d) => ({
    name: LABELS[d.channel],
    value: d.revenue,
    orders: d.orderCount,
  }));

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  if (totalRevenue === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        ยังไม่มีข้อมูล
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.channel} fill={COLORS[entry.channel]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [formatBaht(value ?? 0), "ยอดขาย"]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "12px" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
