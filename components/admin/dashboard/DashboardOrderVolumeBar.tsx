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

export type OrderVolumeDay = { date: string; orders: number };

export function DashboardOrderVolumeBar({
  data,
  tickFormatter,
}: {
  data: OrderVolumeDay[];
  tickFormatter: (d: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={tickFormatter}
          stroke="#71717a"
          interval="preserveStartEnd"
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="#71717a" width={36} />
        <Tooltip
          labelFormatter={(l) => String(l)}
          formatter={(v: number | string | undefined) => [`${Number(v ?? 0)} orders`, "Volume"]}
        />
        <Bar dataKey="orders" name="Orders" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
