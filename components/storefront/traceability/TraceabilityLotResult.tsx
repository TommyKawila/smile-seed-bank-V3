"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { TraceabilityLotLookupForm } from "@/components/storefront/traceability/TraceabilityLotLookupForm";
import {
  GF_TRACEABILITY_PACK_DISCLAIMER_EN,
  GF_TRACEABILITY_PACK_DISCLAIMER_TH,
  type TraceabilityLookup,
} from "@/lib/green-future-traceability";

type Props = {
  lookup: TraceabilityLookup;
};

export function TraceabilityLotResult({ lookup }: Props) {
  const { t } = useLanguage();
  const lot = lookup.kind === "invalid" ? "" : lookup.kind === "found" ? lookup.record.lot : lookup.lot;

  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {t("สรุปล็อตสาธารณะ", "Public lot summary")}
        </p>
        <h1 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {lot || t("เลขล็อตไม่ถูกต้อง", "Invalid lot number")}
        </h1>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
          {lookup.kind === "invalid" ? (
            <p>
              {t(
                "รูปแบบเลขล็อตไม่ถูกต้อง ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข จุด หรือขีด เช่น GF-AF99-2608-B01",
                "That lot number is not a valid format. Use letters, numbers, dots or hyphens, e.g. GF-AF99-2608-B01."
              )}
            </p>
          ) : null}
          {lookup.kind === "unpublished" ? (
            <p>
              {t(
                `ยังไม่มีสรุปล็อตสาธารณะสำหรับ ${lookup.lot} หากเพิ่งได้รับสินค้า ข้อมูลอาจยังไม่ถูกบันทึก`,
                `No public lot summary is available for ${lookup.lot} yet. If you recently received the pack, the record may still be pending.`
              )}
            </p>
          ) : null}
          {lookup.kind === "unknown" ? (
            <p>
              {t(
                "ไม่พบสรุปล็อตสาธารณะสำหรับเลขนี้",
                "No public lot summary is available for this number."
              )}
            </p>
          ) : null}
          {lookup.kind === "found" ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">{t("ชื่อการค้า", "Commercial Name")}</dt>
                <dd className="font-medium">{lookup.record.commercialName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("รหัสพันธุ์", "Variety Code")}</dt>
                <dd className="font-medium">{lookup.record.varietyCode}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("งอก", "Germination")}</dt>
                <dd className="font-medium">{lookup.record.germination}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("บริสุทธิ์", "Purity")}</dt>
                <dd className="font-medium">{lookup.record.purity}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <blockquote className="mt-6 text-xs leading-relaxed text-slate-500">
          {t(GF_TRACEABILITY_PACK_DISCLAIMER_TH, GF_TRACEABILITY_PACK_DISCLAIMER_EN)}
        </blockquote>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <TraceabilityLotLookupForm initialLot={lot} />
          <Link
            href="/traceability"
            className="mt-6 inline-flex min-h-12 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {t("← หน้าบริการตรวจสอบย้อนกลับ", "← Traceability service")}
          </Link>
        </div>
      </div>
    </div>
  );
}
