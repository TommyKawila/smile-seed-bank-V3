"use client";

import type { LucideIcon } from "lucide-react";
import { extractLitersFromText, formatLiters, type SoilMixRecipeLine } from "@/lib/soil-mixer";
import { getSoilMaterialIcon } from "@/lib/soil-mixer-icons";
import { cn } from "@/lib/utils";

const SLICE_COLORS = [
  "#34d399",
  "#38bdf8",
  "#fbbf24",
  "#fb923c",
  "#a78bfa",
  "#f472b6",
  "#94a3b8",
  "#4ade80",
  "#2dd4bf",
  "#e879f9",
] as const;

type Slice = {
  id: string;
  name: string;
  liters: number;
  pct: number;
  color: string;
  Icon: LucideIcon;
};

function buildSlices(lines: SoilMixRecipeLine[]): Slice[] {
  const raw = lines
    .map((line, i) => ({
      id: line.ingredientId ?? line.name,
      name: line.name,
      liters: extractLitersFromText(line.need),
      color: SLICE_COLORS[i % SLICE_COLORS.length],
      Icon: getSoilMaterialIcon(line.ingredientId ?? line.name),
    }))
    .filter((s) => s.liters > 0);
  const total = raw.reduce((sum, s) => sum + s.liters, 0);
  if (total <= 0) return [];
  return raw.map((s) => ({
    ...s,
    pct: Math.round((s.liters / total) * 1000) / 10,
  }));
}

function conicGradient(slices: Slice[]): string {
  const total = slices.reduce((n, x) => n + x.liters, 0);
  let acc = 0;
  const stops = slices.map((s) => {
    const start = (acc / total) * 100;
    acc += s.liters;
    const end = (acc / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function SoilMixRecipePie({
  lines,
  totalLabel,
  className,
}: {
  lines: SoilMixRecipeLine[];
  totalLabel: string;
  className?: string;
}) {
  const slices = buildSlices(lines);
  const totalLiters = slices.reduce((n, s) => n + s.liters, 0);

  if (!slices.length) return null;

  return (
    <div className={cn("flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-3", className)}>
      <div className="relative mx-auto h-[88px] w-[88px] shrink-0 sm:h-[96px] sm:w-[96px]">
        <div
          className="h-full w-full rounded-full"
          style={{ background: conicGradient(slices) }}
          role="img"
          aria-label={totalLabel}
        />
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-background text-center">
          <span className="text-[9px] leading-none text-muted-foreground">Total</span>
          <span className="text-xs font-bold tabular-nums text-foreground sm:text-sm">
            {formatLiters(totalLiters)} L
          </span>
        </div>
      </div>
      <ul className="grid w-full min-w-0 flex-1 grid-cols-2 gap-x-2 gap-y-1">
        {slices.map((s) => (
          <li key={s.id} className="flex min-w-0 items-center gap-1">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            <s.Icon className="h-3 w-3 shrink-0 text-emerald-400/80" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[10px] text-foreground sm:text-[11px]">
              {s.name}
            </span>
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {s.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
