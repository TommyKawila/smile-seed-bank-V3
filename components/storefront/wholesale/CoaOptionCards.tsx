"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { CoaMode } from "@/lib/wholesale-bulk-pricing";

type Props = {
  mode: CoaMode;
  onChange: (mode: CoaMode) => void;
};

export function CoaOptionCards({ mode, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-900">
        {t("ตัวเลือกใบรับรอง COA", "COA certificate options")}
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("none")}
          className={`rounded-xl border-2 p-4 text-left transition ${
            mode === "none"
              ? "border-emerald-600 bg-emerald-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="font-semibold text-slate-900">
            {t("No COA (จัดส่งด่วน)", "No COA (Express shipping)")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t(
              "เหมาะสำหรับผู้ที่ต้องการสินค้าด่วน",
              "Best if you need seeds quickly"
            )}
          </p>
          <p className="mt-2 text-xs font-medium text-emerald-800">
            {t(
              "จัดส่งทันทีหลังชำระเงิน (ได้รับสินค้าใน 3–7 วันทำการ)",
              "Ships after payment (delivery in 3–7 business days)"
            )}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange("with")}
          className={`rounded-xl border-2 p-4 text-left transition ${
            mode === "with"
              ? "border-amber-500 bg-amber-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="font-semibold text-slate-900">
            {t(
              "With COA (รวมใบรับรองผลแล็บ)",
              "With COA (includes lab certificates)"
            )}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t(
              "เหมาะสำหรับฟาร์มที่ต้องใช้เอกสารยื่นหน่วยงานรัฐ",
              "Best for farms that need documents for government filings"
            )}
          </p>
          <p className="mt-2 text-xs font-medium text-amber-800">
            {t(
              "ต้องส่งตรวจแล็บมาตรฐานสากล ~30 วันทำการ (จัดส่งหลังผลแล็บออกใน 3–7 วัน)",
              "Requires international lab testing ~30 business days (then ships in 3–7 days after results)"
            )}
          </p>
        </button>
      </div>

      {mode === "with" && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {t(
            "⚠️ โปรดทราบ: การขอใบรับรอง COA มีขั้นตอนการตรวจแล็บมาตรฐาน ซึ่งใช้เวลาดำเนินการประมาณ 30 วันทำการ",
            "⚠️ Note: COA certificates require standard lab testing, which takes about 30 business days"
          )}
        </div>
      )}
    </div>
  );
}
