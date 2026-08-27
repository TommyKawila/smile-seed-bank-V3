"use client";

import { FileStack, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  GF_DISPATCH_AFTER_PO_EN,
  GF_DISPATCH_AFTER_PO_TH,
  GF_TRACEABILITY_CLAIM_EN,
  GF_TRACEABILITY_CLAIM_TH,
  GF_TRACEABILITY_DISCLAIMER_EN,
  GF_TRACEABILITY_DISCLAIMER_TH,
} from "@/lib/green-future-approved-marketing";

export function TrustCompliance() {
  const { t } = useLanguage();

  return (
    <section id="coa" className="scroll-mt-24 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-start gap-3">
          <FileStack className="mt-1 h-6 w-6 text-emerald-600" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t(
                "ข้อมูลคุณภาพตามล็อต · แล็บภายนอกเมื่อสั่ง",
                "Lot-specific quality data · external lab testing when ordered"
              )}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {t(
                "ข้อมูลทดสอบต่อล็อตตามที่ผู้ผลิตยืนยัน — COA แล็บภายนอกเป็นบริการเสริม คิดแยกตามล็อต ไม่รวมทุกออเดอร์",
                "Per-lot test data as confirmed by the producer — external lab COA is an optional add-on, charged per lot, not included on every order."
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <h3 className="text-base font-bold text-emerald-900">
            {t("เอกสารตรวจสอบย้อนกลับสำหรับ GACP", "Supporting traceability for GACP")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-950/80">
            {t(
              `${GF_TRACEABILITY_CLAIM_TH} — ${GF_TRACEABILITY_DISCLAIMER_TH} ติดต่อทีม B2B เพื่อขอรายละเอียดตามล็อตที่ยืนยัน`,
              `${GF_TRACEABILITY_CLAIM_EN} — ${GF_TRACEABILITY_DISCLAIMER_EN}. Contact our B2B team for details on the confirmed lot.`
            )}
          </p>
        </div>

        <div className="mt-6 inline-flex max-w-full flex-col gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <p>
              {t(
                "ระยะเวลาจัดส่งเป็นประมาณการตามล็อตและ quotation — Option 1: ประมาณ 3–7 วันทำการหลัง accepted PO · มี COA: แล็บ ~30 วัน แล้วจัดส่งอีก 3–7 วัน",
                "Dispatch is indicative per lot and quotation — Option 1: ~3–7 business days after accepted PO · with COA: lab ~30 days then dispatch ~3–7 days"
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
