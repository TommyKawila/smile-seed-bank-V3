"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExecutiveStatsPayload } from "@/hooks/useExecutiveStats";
import { formatPrice } from "@/lib/utils";

const EMERALD = "#059669";
const NAVY = "#003366";
const AMBER = "#d97706";

type DailyRow = ExecutiveStatsPayload["dailyTrend"][number];

export function ExecutiveDailyTrendChart({ dailyTrend }: { dailyTrend: DailyRow[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#71717a" />
        <YAxis tick={{ fontSize: 10 }} stroke="#71717a" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip
          formatter={(v: number | string | undefined) => formatPrice(Number(v ?? 0))}
          labelStyle={{ color: "#27272a" }}
        />
        <Legend />
        <Bar dataKey="revenue" name="รายได้" fill={EMERALD} radius={[2, 2, 0, 0]} maxBarSize={28} />
        <Bar dataKey="shipping" name="ค่าจัดส่ง" fill={NAVY} radius={[2, 2, 0, 0]} maxBarSize={28} />
        <Bar dataKey="discount" name="ส่วนลด" fill={AMBER} radius={[2, 2, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
