"use client";

import { Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  GF_DISPATCH_AFTER_PO_EN,
  GF_DISPATCH_AFTER_PO_TH,
  GF_OPTION1_DISPATCH_EN,
  GF_OPTION1_DISPATCH_TH,
} from "@/lib/green-future-approved-marketing";

export function TrustCompliance() {
  const { t } = useLanguage();

  return (
    <section className="scroll-mt-24 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="inline-flex max-w-full flex-col gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <p>
              {t(GF_OPTION1_DISPATCH_TH, GF_OPTION1_DISPATCH_EN)}
              {" · "}
              {t(
                "มี COA แล็บภายนอก: แล็บประมาณ 30 วันทำการ แล้วจัดส่งอีกประมาณ 3–7 วัน — ตามใบเสนอราคา",
                "With external lab COA: lab about 30 business days, then indicative dispatch 3–7 days — per quotation"
              )}
            </p>
          </div>
          <p className="pl-8 text-xs text-slate-500">
            {t(GF_DISPATCH_AFTER_PO_TH, GF_DISPATCH_AFTER_PO_EN)}
          </p>
        </div>
      </div>
    </section>
  );
}
