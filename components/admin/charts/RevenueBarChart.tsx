"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RevenueDataPoint } from "@/services/dashboard-service";

interface RevenueBarChartProps {
  data: RevenueDataPoint[];
}

const formatBaht = (value: number) =>
  `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        ยังไม่มีข้อมูลยอดขาย
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => [
            formatBaht(value ?? 0),
            name === "revenue" ? "ยอดขาย" : name === "cogs" ? "ต้นทุน" : "กำไร",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e4e4e7",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(value) =>
            value === "revenue" ? "ยอดขาย" : value === "cogs" ? "ต้นทุน" : "กำไร"
          }
          wrapperStyle={{ fontSize: "12px" }}
        />
        <Bar dataKey="revenue" fill="#15803d" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cogs" fill="#d4d4d8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" fill="#86efac" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
