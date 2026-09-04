"use client";

import { useMockup } from "@/components/mockup/MockupContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPackRatioPosition } from "@/lib/mockup-dimensions";

export function MockupControls() {
  const { data, setLabelPosition } = useMockup();
  const p = data.labelPosition;
  const ratio = isPackRatioPosition(p);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(
        [
          [
            "x",
            ratio ? p.x * 100 : p.x,
            0,
            ratio ? 100 : 2000,
            ratio ? 0.5 : 1,
            ratio ? "X (% pack)" : "X (px)",
            ratio,
          ],
          [
            "y",
            ratio ? p.y * 100 : p.y,
            0,
            ratio ? 100 : 2000,
            ratio ? 0.5 : 1,
            ratio ? "Y (% pack)" : "Y (px)",
            ratio,
          ],
          ["scale", p.scale, 0.2, 3, 0.01, "Scale", false],
          ["rotation", p.rotation, -180, 180, 1, "Rotate °", false],
        ] as const
      ).map(([key, value, min, max, step, label, asPercent]) => (
        <div key={key} className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-slate-500">
            {label}
          </Label>
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(2))}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (key === "x" || key === "y") {
                setLabelPosition({
                  [key]: asPercent ? n / 100 : n,
                  unit: asPercent ? "ratio" : "px",
                });
                return;
              }
              setLabelPosition({ [key]: n });
            }}
          />
          <input
            type="range"
            className="w-full"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (key === "x" || key === "y") {
                setLabelPosition({
                  [key]: asPercent ? n / 100 : n,
                  unit: asPercent ? "ratio" : "px",
                });
                return;
              }
              setLabelPosition({ [key]: n });
            }}
          />
        </div>
      ))}
    </div>
  );
}
