"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  GACP_FEATURED_STRAINS,
  formatGacpVarietyRef,
} from "@/lib/gacp-featured-strains";

export function GacpFeaturedStrains() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-slate-50/50 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("สายพันธุ์ตัวอย่าง — เอกสารตามล็อตที่ยืนยัน", "Sample strains — documents follow the confirmed lot")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {t(
            "ตัวอย่างสายพันธุ์ อ้างอิงด้วยรหัสพันธุ์เป็นหลัก ชุดเอกสารจริงขึ้นกับล็อตที่ผู้ผลิตยืนยัน ไม่การันตีว่าทุกรายการด้านล่างมีพร้อมขาย",
            "Sample genetics referenced by variety code. The actual document pack depends on the producer-confirmed lot and is not guaranteed for every listed item."
          )}
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GACP_FEATURED_STRAINS.map((strain) => {
            const ref = formatGacpVarietyRef(strain.varietyCode, strain.strainName);
            return (
              <li key={strain.varietyCode}>
                <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
                  <span className="inline-flex w-fit items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    {t("เอกสารตามล็อต", "Per-lot documents")}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">
                    {strain.displayName}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-emerald-800">{ref}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {t(
                      "สถานะและขอบเขตเอกสารยืนยันตาม quotation",
                      "Availability and document scope confirmed per quotation"
                    )}
                  </p>
                  <dl className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between gap-2">
                      <dt>{t("ประเภท", "Type")}</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {strain.typeLabel}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("รูปแบบ", "Format")}</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {strain.seedFormat === "AUTO_FEM" ? "Auto FEM" : "FEM"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {t("เอกสารที่ขอได้ (ไม่แถมทุกชุด)", "Available on request (not bundled)")}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {strain.documents.map((doc) => (
                        <li
                          key={doc}
                          className="flex items-center gap-1.5 text-xs text-slate-700"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href="#gacp-inquiry"
                    className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    {t("ขอเอกสารสายนี้", "Request this package")}
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
