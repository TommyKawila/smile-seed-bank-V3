"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RevenueProfitPoint = {
  date: string;
  revenue: number;
  profit: number;
};

function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function RevenueProfitChart({ data }: { data: RevenueProfitPoint[] }) {
  const empty = data.every((point) => point.revenue === 0 && point.profit === 0);

  return (
    <Card className="border-zinc-200/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-800 sm:text-base">
          Revenue vs Profit
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] px-2 pb-4 sm:h-[320px] sm:px-4">
        {empty ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 text-sm text-zinc-500">
            No paid financial data in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value: string) => value.slice(5)}
                stroke="hsl(var(--muted-foreground))"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                stroke="hsl(var(--muted-foreground))"
                width={42}
              />
              <Tooltip
                labelFormatter={(label) => String(label)}
                formatter={(value: number | string | undefined, name) => [
                  formatBaht(Number(value ?? 0)),
                  name === "revenue" ? "Revenue" : "Profit",
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="hsl(var(--secondary-foreground))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
