"use client";

import type { CoaMode } from "@/lib/wholesale-bulk-pricing";

type Props = {
  mode: CoaMode;
  onChange: (mode: CoaMode) => void;
};

export function CoaOptionCards({ mode, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-900">
        ตัวเลือกใบรับรอง COA
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
          <p className="font-semibold text-slate-900">No COA (จัดส่งด่วน)</p>
          <p className="mt-1 text-sm text-slate-600">
            เหมาะสำหรับผู้ที่ต้องการสินค้าด่วน
          </p>
          <p className="mt-2 text-xs font-medium text-emerald-800">
            จัดส่งทันทีหลังชำระเงิน (ได้รับสินค้าใน 3–7 วันทำการ)
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
            With COA (รวมใบรับรองผลแล็บ)
          </p>
          <p className="mt-1 text-sm text-slate-600">
            เหมาะสำหรับฟาร์มที่ต้องใช้เอกสารยื่นหน่วยงานรัฐ
          </p>
          <p className="mt-2 text-xs font-medium text-amber-800">
            ต้องส่งตรวจแล็บมาตรฐานสากล ~30 วันทำการ (จัดส่งหลังผลแล็บออกใน
            3–7 วัน)
          </p>
        </button>
      </div>

      {mode === "with" && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          ⚠️ โปรดทราบ: การขอใบรับรอง COA มีขั้นตอนการตรวจแล็บมาตรฐาน ซึ่งใช้เวลาดำเนินการประมาณ
          30 วันทำการ
        </div>
      )}
    </div>
  );
}
