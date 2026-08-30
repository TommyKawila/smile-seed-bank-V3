"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  GF_OPTION1_DISPATCH_EN,
  GF_OPTION1_DISPATCH_TH,
  GF_OPTION1_LABEL_EN,
  GF_OPTION1_LABEL_TH,
  GF_WITH_COA_DISPATCH_EN,
  GF_WITH_COA_DISPATCH_TH,
} from "@/lib/green-future-approved-marketing";
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
        {t("ตัวเลือกเอกสาร", "Document options")}
      </h3>
      <p className="text-sm text-slate-600">
        {t(
          "เลือกเพิ่ม COA แล็บภายนอกได้ด้านล่าง — เอกสารพื้นฐานต่อล็อตแถมตามรายการด้านบน",
          "Optional external lab COA below — basic per-lot documents are included as listed above"
        )}
      </p>
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
            {t("เมล็ดอย่างเดียว", "Seeds only")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t(GF_OPTION1_LABEL_TH, GF_OPTION1_LABEL_EN)}
          </p>
          <p className="mt-2 text-xs font-medium text-emerald-800">
            {t(GF_OPTION1_DISPATCH_TH, GF_OPTION1_DISPATCH_EN)}
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
              "ชุดเอกสารล็อต / COA แล็บภายนอก",
              "Lot document pack / external lab COA"
            )}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t(
              "เพิ่ม COA แล็บภายนอกต่อสาย — คิดแยกตามล็อต",
              "Add external lab COA per strain — charged separately per lot"
            )}
          </p>
          <p className="mt-2 text-xs font-medium text-amber-800">
            {t(GF_WITH_COA_DISPATCH_TH, GF_WITH_COA_DISPATCH_EN)}
          </p>
        </button>
      </div>

      {mode === "with" && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {t(
            "⚠️ COA แล็บภายนอกเป็นบริการเสริม คิดแยกตามล็อต — ไม่รับประกันผล GACP",
            "⚠️ External lab COA is an optional add-on per lot — not a GACP audit guarantee"
          )}
        </div>
      )}
    </div>
  );
}
