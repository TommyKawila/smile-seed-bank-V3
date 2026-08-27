"use client";

import { useMockup } from "@/components/mockup/MockupContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_FONT_SCALE } from "@/types/label";

export function FontScaleControls() {
  const { data, setField } = useMockup();
  const scale = data.fontScale ?? DEFAULT_FONT_SCALE;
  const pct = Math.round(scale * 100);

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
        min={50}
        max={150}
        step={5}
        value={pct}
        onChange={(e) => {
          const next = Number(e.target.value) / 100;
          if (Number.isFinite(next)) {
            setField("fontScale", Math.max(0.5, Math.min(1.5, next)));
          }
        }}
      />
      <input
        type="range"
        className="w-full"
        min={50}
        max={150}
        step={5}
        value={pct}
        onChange={(e) =>
          setField("fontScale", Number(e.target.value) / 100)
        }
      />
    </div>
  );
}
