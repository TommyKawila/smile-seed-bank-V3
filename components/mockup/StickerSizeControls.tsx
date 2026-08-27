"use client";

import { useState } from "react";
import { Lock, RotateCcw, Unlock } from "lucide-react";
import { useMockup } from "@/components/mockup/MockupContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCm } from "@/lib/mockup-dimensions";
import { DEFAULT_LABEL_SIZE_CM } from "@/types/label";

export function StickerSizeControls() {
  const { data, setLabelSizeCm, setLabelPosition } = useMockup();
  const [lockAspect, setLockAspect] = useState(true);
  const size = data.labelSizeCm;
  const ratio = size.width / size.height || 1;

  function updateWidth(next: number) {
    if (!Number.isFinite(next) || next <= 0) return;
    setLabelSizeCm(
      lockAspect ? { width: next, height: next / ratio } : { width: next }
    );
  }

  function updateHeight(next: number) {
    if (!Number.isFinite(next) || next <= 0) return;
    setLabelSizeCm(
      lockAspect ? { height: next, width: next * ratio } : { height: next }
    );
  }

  function resetSize() {
    setLabelSizeCm({ ...DEFAULT_LABEL_SIZE_CM });
    setLabelPosition({ scale: 1 });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Target: {formatCm(size.width)} × {formatCm(size.height)} cm
          {data.labelPosition.scale !== 1
            ? ` · scale ${data.labelPosition.scale.toFixed(2)}×`
            : ""}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setLockAspect((v) => !v)}
        >
          {lockAspect ? (
            <Lock className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Unlock className="mr-1 h-3.5 w-3.5" />
          )}
          {lockAspect ? "Locked" : "Free"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-slate-500">
            Width (cm)
          </Label>
          <Input
            type="number"
            min={0.5}
            max={20}
            step={0.1}
            value={size.width}
            onChange={(e) => updateWidth(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-slate-500">
            Height (cm)
          </Label>
          <Input
            type="number"
            min={0.5}
            max={20}
            step={0.1}
            value={size.height}
            onChange={(e) => updateHeight(Number(e.target.value))}
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={resetSize}
      >
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Reset to 5.5 × 5.5 cm
      </Button>
    </div>
  );
}
