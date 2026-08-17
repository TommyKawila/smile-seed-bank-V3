"use client";

import Link from "next/link";
import { Building2, FileDown, MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  onRequestCatalog: () => void;
};

export function WholesaleHero({ onRequestCatalog }: Props) {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(15,23,42,0.06), transparent 35%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <Building2 className="h-3.5 w-3.5" aria-hidden />
          {t("B2B Wholesale · Thailand", "B2B Wholesale · Thailand")}
        </p>
        <h1 className="max-w-3xl font-sans text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {t(
            "พาร์ทเนอร์เมล็ดพันธุ์กัญชา B2B ที่ธุรกิจไทยไว้ใจ",
            "Thailand's Trusted B2B Cannabis Seed Partner"
          )}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {t(
            "พันธุกรรมพรีเมียมจากบรีดเดอร์ชั้นนำ ส่งจากคลังบางพลี สมุทรปราการ (3–5 วัน) ถูกกฎหมาย ครบเอกสาร ไม่เสี่ยงศุลกากรนำเข้า",
            "Premium genetics sourced directly from top breeders. Fast local fulfillment from our Bang Phli, Samut Prakan warehouse (3-5 days delivery). 100% legal, compliant, and zero import customs risk."
          )}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onRequestCatalog}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {t("ขอแคตตาล็อกขายส่ง", "Request Wholesale Catalog")}
          </button>
          <a
            href="#coa"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            {t("ดาวน์โหลดตัวอย่าง COA", "Download COA Samples")}
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          <Link
            href="/wholesale/gacp"
            className="font-medium text-emerald-700 underline-offset-4 hover:underline"
          >
            {t(
              "เอกสารล็อตสำหรับฟาร์มใบอนุญาต →",
              "Lot documents for licensed farms →"
            )}
          </Link>
        </p>
        <ul className="mt-8 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-6">
          <li className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
            {t("ถูกกฎหมาย · ตรวจสอบย้อนกลับได้", "Legal · Traceable")}
          </li>
          <li className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" aria-hidden />
            {t("คลังบางพลี · ส่งในประเทศ 3–5 วัน", "Bang Phli warehouse · 3–5 days")}
          </li>
        </ul>
      </div>
    </section>
  );
}
