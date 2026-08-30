"use client";

import Image from "next/image";
import { Building2, FileDown, MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  GF_WHOLESALE_HERO_LEAD_EN,
  GF_WHOLESALE_HERO_LEAD_TH,
  GF_WHOLESALE_HERO_TITLE_EN,
  GF_WHOLESALE_HERO_TITLE_TH,
} from "@/lib/green-future-approved-marketing";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

type Props = {
  onRequestCatalog: () => void;
  heroImageUrl: string;
};

export function WholesaleHero({ onRequestCatalog, heroImageUrl }: Props) {
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
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            {t("SGF Seeds · B2B Wholesale", "SGF Seeds · B2B Wholesale")}
          </p>
          <h1 className="max-w-3xl font-sans text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {t(GF_WHOLESALE_HERO_TITLE_TH, GF_WHOLESALE_HERO_TITLE_EN)}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {t(GF_WHOLESALE_HERO_LEAD_TH, GF_WHOLESALE_HERO_LEAD_EN)}
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
              href="#documents"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              {t("เอกสารล็อต / ฟาร์มใบอนุญาต", "Lot documents / licensed farms")}
            </a>
          </div>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-6">
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
              {t("ถูกกฎหมาย · ตรวจสอบย้อนกลับได้", "Legal · Traceable")}
            </li>
            <li className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" aria-hidden />
              {t("จัดส่งในประเทศ · ระยะเวลาตามใบเสนอราคา", "Domestic dispatch · lead time per quotation")}
            </li>
          </ul>
        </div>
        <figure className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
            <Image
              src={heroImageUrl}
              alt={t(
                "ห้องปลูกและแล็บเมล็ดพันธุ์มาตรฐาน GACP",
                "GACP-standard cannabis cultivation lab"
              )}
              fill
              sizes="(min-width: 1024px) 540px, 100vw"
              className="object-cover"
              unoptimized={shouldOffloadImageOptimization(heroImageUrl)}
            />
          </div>
          <figcaption className="mt-2 text-xs text-slate-500">
            {t(
              "สถานที่ผลิตมาตรฐาน GACP",
              "GACP-standard production facility"
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
