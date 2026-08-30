"use client";

import { FileCheck2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function GacpHero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(16,185,129,0.14), transparent 42%), radial-gradient(circle at 85% 0%, rgba(245,158,11,0.08), transparent 36%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("GACP · ฟาร์มใบอนุญาต · ประเทศไทย", "GACP · Licensed Farms · Thailand")}
        </p>
        <h1 className="max-w-4xl font-sans text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {t(
            "เมล็ดพันธุ์ควบคุมพร้อมเอกสารตรวจสอบย้อนกลับ สำหรับฟาร์มใบอนุญาต",
            "Controlled cannabis seeds with traceability documents for licensed farms"
          )}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {t(
            "ผลิตและจำหน่ายตามข้อกำหนดกรมวิชาการเกษตร เอกสารล็อตใช้ประกอบระบบตรวจสอบย้อนกลับและเอกสาร GACP ของลูกค้า — ไม่ใช่ใบรับรอง GACP หรือเอกสาร DTAM และไม่การันตีผลการตรวจ",
            "Produced and sold under Department of Agriculture rules. Lot documents support the customer’s own traceability system and GACP file — they are not a GACP certificate or DTAM document, and they do not guarantee an audit outcome."
          )}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#documents"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <FileCheck2 className="h-4 w-4" aria-hidden />
            {t("ขอแคตตาล็อก B2B และชุดเอกสารล็อต", "Request B2B catalog & lot documents")}
          </a>
          <a
            href="/traceability"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {t("ตรวจเลขล็อต", "Look up a lot number")}
          </a>
        </div>
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-slate-500">
          {t(
            "ใบรับรอง GACP ของผู้ผลิตเป็นของสถานที่ผลิต ไม่ใช่ของล็อตเมล็ด แล็บภายนอกคิดแยกตามที่สั่ง",
            "The producer’s GACP certificate covers the production site, not a seed lot. External laboratory tests are charged separately when ordered."
          )}
        </p>
      </div>
    </section>
  );
}
