"use client";

import Image from "next/image";
import Link from "next/link";
import { FileSearch, Lock, QrCode, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { TraceabilityLotLookupForm } from "@/components/storefront/traceability/TraceabilityLotLookupForm";
import {
  GF_TRACEABILITY_PACK_DISCLAIMER_EN,
  GF_TRACEABILITY_PACK_DISCLAIMER_TH,
  isGfTraceabilityPreview,
} from "@/lib/green-future-traceability";
import { GF_TRACEABILITY_CLAIM_EN, GF_TRACEABILITY_CLAIM_TH } from "@/lib/green-future-approved-marketing";

const TRACEABILITY_HERO_IMAGE = "/images/traceability/hero-scan.webp";

export function TraceabilityPageClient() {
  const { t, locale } = useLanguage();
  const preview = isGfTraceabilityPreview();

  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(15,23,42,0.06), transparent 35%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-12 lg:gap-14">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              {t("ตรวจสอบย้อนกลับ · โปรแกรม SGF SEEDS", "Lot traceability · SGF SEEDS programme")}
            </p>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {t("ตรวจสอบย้อนกลับล็อตเมล็ด", "Seed lot traceability")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {t(GF_TRACEABILITY_CLAIM_TH, GF_TRACEABILITY_CLAIM_EN)}
            </p>
            {preview ? (
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                {t(
                  "บริการนี้พร้อมรับเลขล็อตแล้ว ข้อมูลล็อตสาธารณะจะแสดงเมื่อมีการบันทึกล็อตที่จัดส่งแล้ว",
                  "You can enter a lot number here. Public lot records appear after a delivered lot has been registered."
                )}
              </p>
            ) : null}
          </div>
          <figure className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <Image
                src={TRACEABILITY_HERO_IMAGE}
                alt={t(
                  "สแกน QR บนซองเมล็ดเพื่อตรวจล็อตบนมือถือ",
                  "Scan the QR on a seed pouch to look up the lot on a phone"
                )}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs text-slate-500">
              {t(
                "สแกน QR บนซองซีล — ตรวจล็อตได้ทันทีจากมือถือ",
                "Scan the QR on the sealed pouch — look up the lot instantly on your phone"
              )}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
              {t("ข้อความสำคัญ", "Important notice")}
            </h2>
            <blockquote className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              <p>{t(GF_TRACEABILITY_PACK_DISCLAIMER_TH, GF_TRACEABILITY_PACK_DISCLAIMER_EN)}</p>
              {locale === "th" ? (
                <p className="text-xs text-slate-500" lang="en">
                  {GF_TRACEABILITY_PACK_DISCLAIMER_EN}
                </p>
              ) : null}
            </blockquote>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t("ตรวจเลขล็อต", "Look up a lot number")}
            </h2>
            <p className="mt-2 mb-5 text-sm text-slate-600">
              {t(
                "กรอกเลขล็อตจากฉลากบนซองซีล เพื่อดูสรุปล็อตสาธารณะ",
                "Enter the lot number from the sealed pouch label to view the public lot summary."
              )}
            </p>
            <TraceabilityLotLookupForm />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("ข้อมูลที่แสดงบนหน้านี้", "What this page shows")}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <FileSearch className="h-5 w-5 text-emerald-600" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t("สรุปล็อตสาธารณะ", "Public lot summary")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t(
                  "เมื่อมีข้อมูลล็อตแล้ว จะแสดงชื่อสินค้า รหัสพันธุ์ เลขล็อต สถานะ อัตรางอก ความบริสุทธิ์ วันที่ทดสอบ และผู้ผลิต",
                  "When a lot is registered, this page shows product name, variety code, lot number, status, germination, purity, test date, and producer."
                )}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <Lock className="h-5 w-5 text-emerald-600" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t("เอกสารเพิ่มเติมสำหรับลูกค้าฟาร์ม", "Additional documents for farm customers")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t(
                  "ชุดเอกสารล็อตฉบับเต็มจัดให้ลูกค้าฟาร์มใบอนุญาตตามคำสั่งซื้อ ไม่เปิดเป็นรายการค้นหาสาธารณะ",
                  "Full lot documents are issued to licensed farm customers with their order. They are not published as a public search list."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("สถานที่ผลิต (GACP ของสถานที่ ไม่ใช่ของล็อต)", "Production site (GACP covers the site, not the lot)")}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            {t(
              "ผู้ผลิต: Green Future (Global) Co., Ltd. พ.พ.3 102001102568 · ผู้ขาย: หจก. ทีเอ็มวาย อะโกร เทรด พ.พ.4 1011043900042568 ภายใต้แบรนด์ Smile Seed Bank",
              "Producer: Green Future (Global) Co., Ltd., Por.Por. 3 No. 102001102568 · Seller: T.M.Y Agro Trade Limited Partnership, Por.Por. 4 No. 1011043900042568, trading as Smile Seed Bank"
            )}
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            {t(
              "ใบรับรอง GACP ของผู้ผลิตเป็นของสถานที่ผลิต ไม่ใช่ของล็อตเมล็ด",
              "The producer’s GACP certificate covers the production site, not an individual seed lot."
            )}
          </p>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/wholesale#documents"
            className="inline-flex min-h-12 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {t("← โปรแกรมเมล็ดสำหรับฟาร์มใบอนุญาต", "← Licensed-farm seed programme")}
          </Link>
        </div>
      </section>
    </div>
  );
}
