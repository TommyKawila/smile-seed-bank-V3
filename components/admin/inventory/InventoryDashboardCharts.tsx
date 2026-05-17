"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const EMERALD_COLORS = ["#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

export type InventoryPieSlice = { name: string; value: number };
export type InventoryCategoryRow = { name: string; stock: number };

export function InventoryBreederValuePie({ pieData }: { pieData: InventoryPieSlice[] }) {
  const formatBaht = (v: number) =>
    `฿${v.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;

  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  if (totalPie === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">ยังไม่มีข้อมูล</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={EMERALD_COLORS[i % EMERALD_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [formatBaht(value ?? 0), "มูลค่า"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e4e4e7",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InventoryStockByCategoryBar({ stockByCategory }: { stockByCategory: InventoryCategoryRow[] }) {
  if (stockByCategory.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">ยังไม่มีข้อมูล</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={stockByCategory}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} />
        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#71717a" }} />
        <Tooltip
          formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), "จำนวน"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e4e4e7",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="stock" fill="#047857" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
