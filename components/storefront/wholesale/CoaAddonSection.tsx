"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";
import type { BulkPricingConfig } from "@/lib/wholesale-bulk-pricing";
import { CoaSamplePreviewModal } from "./CoaSamplePreviewModal";

type Props = {
  config: BulkPricingConfig;
  buyExtra: boolean;
  packageACount: number;
  packageBCount: number;
  onBuyExtraChange: (v: boolean) => void;
  onPackageAChange: (n: number) => void;
  onPackageBChange: (n: number) => void;
};

type SamplePackage = "A" | "B";

// TODO: Replace this placeholder with the actual Package A PDF/Image URL from Green Future
const COA_SAMPLE_PACKAGE_A_URL: string | null = null;
// TODO: Replace this placeholder with the actual Package B PDF/Image URL from Green Future
const COA_SAMPLE_PACKAGE_B_URL: string | null = null;

function SampleLink({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-emerald-600 transition hover:text-emerald-700 hover:underline"
    >
      <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

export function CoaAddonSection({
  config,
  buyExtra,
  packageACount,
  packageBCount,
  onBuyExtraChange,
  onPackageAChange,
  onPackageBChange,
}: Props) {
  const { t } = useLanguage();
  const [sample, setSample] = useState<SamplePackage | null>(null);

  const sampleTitle =
    sample === "A"
      ? t(
          "ตัวอย่างใบรับรอง Package A (External lab COA)",
          "Sample Certificate Package A (External lab COA)"
        )
      : sample === "B"
        ? t(
            "ตัวอย่างใบรับรอง Package B (External lab COA + moisture)",
            "Sample Certificate Package B (External lab COA + moisture)"
          )
        : "";

  const sampleUrl =
    sample === "A"
      ? COA_SAMPLE_PACKAGE_A_URL
      : sample === "B"
        ? COA_SAMPLE_PACKAGE_B_URL
        : null;

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
          {t(
            "ต้องการซื้อบริการตรวจ COA เพิ่มเติมสำหรับสายพันธุ์ที่ยังไม่ได้สิทธิ์ฟรี",
            "I want to purchase extra COA testing for strains without a free entitlement"
          )}
        </span>
      </label>

      {buyExtra && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium leading-snug text-slate-900">
                Package A (Purity + Germination) — +
                {config.coaPackageAThb.toLocaleString("en-US")}{" "}
                {t("THB/สายพันธุ์", "THB/strain")}
              </Label>
              <p className="text-xs leading-snug text-slate-500">
                {t(
                  "ตรวจวิเคราะห์ความบริสุทธิ์และอัตราการงอกโดยแล็บภายนอก — แล็บและวิธีทดสอบตามใบเสนอราคา",
                  "External laboratory purity and germination analysis — lab and method per quotation"
                )}
              </p>
              <SampleLink
                onClick={() => setSample("A")}
                label={t(
                  "ดูตัวอย่างใบรับรอง (View Sample)",
                  "View Sample Certificate"
                )}
              />
            </div>
            <Input
              type="number"
              min={0}
              value={packageACount}
              onChange={(e) =>
                onPackageAChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))
              }
              className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium leading-snug text-slate-900">
                Package B (Purity + Germination + Moisture) — +
                {config.coaPackageBThb.toLocaleString("en-US")}{" "}
                {t("THB/สายพันธุ์", "THB/strain")}
              </Label>
              <p className="text-xs leading-snug text-slate-500">
                {t(
                  "ตรวจเต็มรูปแบบ ครอบคลุมความบริสุทธิ์ อัตราการงอก และความชื้นโดยแล็บภายนอก — แล็บและวิธีทดสอบตามใบเสนอราคา",
                  "External lab test: purity, germination, and moisture — lab and method per quotation"
                )}
              </p>
              <SampleLink
                onClick={() => setSample("B")}
                label={t(
                  "ดูตัวอย่างใบรับรอง (View Sample)",
                  "View Sample Certificate"
                )}
              />
            </div>
            <Input
              type="number"
              min={0}
              value={packageBCount}
              onChange={(e) =>
                onPackageBChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))
              }
              className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      <CoaSamplePreviewModal
        open={sample != null}
        onOpenChange={(open) => {
          if (!open) setSample(null);
        }}
        title={sampleTitle}
        sampleUrl={sampleUrl}
        packageKey={sample ?? "A"}
      />
    </div>
  );
}
