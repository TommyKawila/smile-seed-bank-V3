"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BulkPricingConfig } from "@/lib/wholesale-bulk-pricing";

type Props = {
  config: BulkPricingConfig;
  buyExtra: boolean;
  packageACount: number;
  packageBCount: number;
  onBuyExtraChange: (v: boolean) => void;
  onPackageAChange: (n: number) => void;
  onPackageBChange: (n: number) => void;
};

export function CoaAddonSection({
  config,
  buyExtra,
  packageACount,
  packageBCount,
  onBuyExtraChange,
  onPackageAChange,
  onPackageBChange,
}: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex items-start gap-3 text-sm text-slate-800">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={buyExtra}
          onChange={(e) => onBuyExtraChange(e.target.checked)}
        />
        <span>
          ต้องการซื้อบริการตรวจ COA เพิ่มเติมสำหรับสายพันธุ์ที่ยังไม่ได้สิทธิ์ฟรี
        </span>
      </label>

      {buyExtra && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>
              Package A (Purity + Germination) — +
              {config.coaPackageAThb.toLocaleString("en-US")} THB/สาย
            </Label>
            <Input
              type="number"
              min={0}
              value={packageACount}
              onChange={(e) =>
                onPackageAChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>
              Package B (+ Moisture) — +
              {config.coaPackageBThb.toLocaleString("en-US")} THB/สาย
            </Label>
            <Input
              type="number"
              min={0}
              value={packageBCount}
              onChange={(e) =>
                onPackageBChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
