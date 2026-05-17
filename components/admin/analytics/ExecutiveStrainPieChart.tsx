"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const UNKNOWN_BREEDER_LABEL = "Unknown Breeder";

export type ExecutiveStrainPieDatum = {
  strainName: string;
  breederName: string;
  legendLabel: string;
  value: number;
  color: string;
};

function StrainPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { strainName?: string; breederName?: string; value?: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p?.strainName) return null;
  const breeder = (p.breederName ?? "").trim() || UNKNOWN_BREEDER_LABEL;
  const title = `${p.strainName} (${breeder})`;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="max-w-[240px] break-words font-semibold text-zinc-900">{title}</p>
      <p className="text-zinc-600">{Number(p.value ?? 0).toLocaleString("th-TH")} หน่วย</p>
    </div>
  );
}

export function ExecutiveStrainPieChart({ pieData }: { pieData: ExecutiveStrainPieDatum[] }) {
  return (
    <div className="flex h-[300px] flex-col gap-4 sm:h-[280px] sm:flex-row sm:items-center">
      <div className="h-[200px] min-h-[180px] w-full flex-1 sm:h-full sm:min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="legendLabel"
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={82}
              paddingAngle={2}
              label={({ percent }) =>
                typeof percent === "number" && percent > 0.08 ? `${Math.round(percent * 100)}%` : ""
              }
              labelLine={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={`${entry.legendLabel}-${i}`} fill={entry.color} stroke="#fff" strokeWidth={1.5} />
              ))}
            </Pie>
            <Tooltip content={<StrainPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="max-h-[200px] w-full shrink-0 space-y-2 overflow-y-auto text-xs sm:max-h-none sm:w-[min(100%,240px)] sm:border-l sm:border-zinc-100 sm:pl-3">
        {pieData.map((d, li) => (
          <li key={`${d.legendLabel}-${li}`} className="flex gap-2">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-white"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1 leading-snug">
              <p className="break-words font-medium text-zinc-800">{d.legendLabel}</p>
              <p className="text-zinc-500">{d.value.toLocaleString("th-TH")} หน่วย</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
