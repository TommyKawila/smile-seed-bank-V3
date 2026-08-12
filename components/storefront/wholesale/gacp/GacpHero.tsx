"use client";

import Link from "next/link";
import { Calculator, FileCheck2, ShieldCheck } from "lucide-react";
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
            "เมล็ดพันธุ์กัญชาพร้อมเอกสาร GACP สำหรับผู้ปลูกถูกกฎหมายและฟาร์มส่งออก",
            "GACP-Compliant Cannabis Seeds for Licensed Cultivators & Export-Grade Farms"
          )}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {t(
            "พันธุกรรมตรวจสอบย้อนกลับได้ 100% พร้อม COA และเอกสารพืชกักกัน ที่จำเป็นต่อการตรวจ GACP และการส่งออก",
            "100% traceable genetics with Certificate of Analysis (COA) and phytosanitary documentation required for GACP audits and international export."
          )}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#gacp-inquiry"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <FileCheck2 className="h-4 w-4" aria-hidden />
            {t("ขอแคตตาล็อก B2B และ COA", "Request B2B Catalog & COA")}
          </a>
          <Link
            href="/wholesale"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Calculator className="h-4 w-4" aria-hidden />
            {t("คำนวณราคาขายส่ง", "Bulk pricing calculator")}
          </Link>
        </div>
      </div>
    </section>
  );
}
