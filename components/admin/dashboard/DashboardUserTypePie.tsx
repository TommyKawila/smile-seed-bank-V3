"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type UserTypePieSlice = { name: string; value: number; fill: string };

export function DashboardUserTypePie({ data }: { data: UserTypePieSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={44}
          outerRadius={72}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={`${entry.name}-${i}`} fill={entry.fill} stroke="#fff" strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number | string | undefined) => [`${Number(v ?? 0)} orders`, ""]} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => <span className="text-zinc-700">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
