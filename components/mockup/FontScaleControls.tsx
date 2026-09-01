"use client";

import { useMockup } from "@/components/mockup/MockupContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_FONT_SCALE,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
} from "@/types/label";

const MIN_PCT = Math.round(MIN_FONT_SCALE * 100);
const MAX_PCT = Math.round(MAX_FONT_SCALE * 100);

export function FontScaleControls() {
  const { data, setField } = useMockup();
  const scale = data.fontScale ?? DEFAULT_FONT_SCALE;
  const pct = Math.round(scale * 100);

  const applyPct = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const next = raw / 100;
    setField("fontScale", Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, next)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] uppercase tracking-wide text-slate-500">
          Font size
        </Label>
        <span className="text-xs tabular-nums text-slate-500">{pct}%</span>
      </div>
      <Input
        type="number"
        min={MIN_PCT}
        max={MAX_PCT}
        step={5}
        value={pct}
        onChange={(e) => applyPct(Number(e.target.value))}
      />
      <input
        type="range"
        className="w-full"
        min={MIN_PCT}
        max={MAX_PCT}
        step={5}
        value={pct}
        onChange={(e) => applyPct(Number(e.target.value))}
      />
    </div>
  );
}
