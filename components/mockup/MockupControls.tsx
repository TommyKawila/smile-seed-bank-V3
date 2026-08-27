"use client";

import { useMockup } from "@/components/mockup/MockupContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MockupControls() {
  const { data, setLabelPosition } = useMockup();
  const p = data.labelPosition;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(
        [
          ["x", p.x, 0, 2000, 1, "X (px)"],
          ["y", p.y, 0, 2000, 1, "Y (px)"],
          ["scale", p.scale, 0.2, 3, 0.01, "Scale"],
          ["rotation", p.rotation, -180, 180, 1, "Rotate °"],
        ] as const
      ).map(([key, value, min, max, step, label]) => (
        <div key={key} className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-slate-500">
            {label}
          </Label>
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) =>
              setLabelPosition({ [key]: Number(e.target.value) })
            }
          />
          <input
            type="range"
            className="w-full"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) =>
              setLabelPosition({ [key]: Number(e.target.value) })
            }
          />
        </div>
      ))}
    </div>
  );
}
