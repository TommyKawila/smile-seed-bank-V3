"use client";

import Link from "next/link";
import { FileSearch, Lock, QrCode, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { TraceabilityLotLookupForm } from "@/components/storefront/traceability/TraceabilityLotLookupForm";
import {
  GF_TRACEABILITY_PACK_DISCLAIMER_EN,
  GF_TRACEABILITY_PACK_DISCLAIMER_TH,
  GF_TRACEABILITY_PUBLIC_FIELDS,
  GF_TRACEABILITY_RESTRICTED_FIELDS,
  isGfTraceabilityPreview,
} from "@/lib/green-future-traceability";
import { GF_TRACEABILITY_CLAIM_EN, GF_TRACEABILITY_CLAIM_TH } from "@/lib/green-future-approved-marketing";

export function TraceabilityPageClient() {
  const { t, locale } = useLanguage();
  const preview = isGfTraceabilityPreview();

  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <QrCode className="h-3.5 w-3.5" aria-hidden />
            {t("Traceability Pack · โปรแกรม Green Future", "Traceability Pack · Green Future programme")}
          </p>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("ตรวจสอบย้อนกลับล็อตเมล็ด", "Seed lot traceability")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {t(GF_TRACEABILITY_CLAIM_TH, GF_TRACEABILITY_CLAIM_EN)}
          </p>
          {preview ? (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              {t(
                "ฉบับตรวจร่วมกับ Green Future — ยังไม่เปิดข้อมูลล็อตจริง และยังไม่ใส่ QR บนซอง จนกว่า GF อนุมัติลิงก์และนำเข้าล็อตรอบแรก",
                "Partner-review draft — live lot data is not published and pouch QR is not active until Green Future approves this link and the first lot is imported."
              )}
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
              {t("ข้อความปฏิเสธความรับผิด (ตาม GF/SSB/2026-0824)", "Disclaimer (per GF/SSB/2026-0824)")}
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
                "กรอกเลขล็อตจากฉลากซองซีล — ชั้นสาธารณะแสดงเฉพาะสรุปล็อต ไม่เปิด pedigree และไม่ค้นรายการล็อตทั้งหมด",
                "Enter the lot number from the sealed pouch label. The public layer shows a lot summary only — no pedigree and no full lot list."
              )}
            </p>
            <TraceabilityLotLookupForm />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("การเข้าถึง 2 ชั้น", "Two-tier access")}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <FileSearch className="h-5 w-5 text-emerald-600" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t("สาธารณะ — ไม่ต้องสมัคร", "Public — no registration")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t(
                  "สแกน QR หรือกรอกเลขล็อต เห็นสรุปชื่อการค้า รหัสพันธุ์ ล็อต สถานะ งอก บริสุทธิ์ วันที่ทดสอบ ฐานทดสอบ ผู้ผลิต และการยืนยันว่าเลขล็อตตรงเอกสาร Green Future",
                  "Scan the QR or enter a lot number to see commercial name, variety code, lot, status, germination, purity, test date, test basis, producer, and confirmation that the number matches a Green Future record."
                )}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {GF_TRACEABILITY_PUBLIC_FIELDS.map((field) => (
                  <li key={field.id}>{t(field.th, field.en)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <Lock className="h-5 w-5 text-emerald-600" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t("QR/token หรือบัญชีที่อนุญาต", "QR/token or authorised account")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t(
                  "เอกสารเต็มเปิดหลังยืนยันลูกค้าฟาร์ม — PDF ที่ลงนาม COA/ISTA เอกสารต้นทาง และประวัติแก้ ไม่เปิดค้นแบบไล่เลขล็อต",
                  "Full documents open after farm-customer verification — signed PDF, COA/ISTA, source document, and change history. Sequential lot enumeration is not allowed."
                )}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {GF_TRACEABILITY_RESTRICTED_FIELDS.map((field) => (
                  <li key={field.en}>{t(field.th, field.en)}</li>
                ))}
              </ul>
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
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-600">
            {t(
              "รูปโรงปลูกและโรงงานผลิตเมล็ดจะใส่หลังได้รับไฟล์จาก Green Future — คุณจูเลียอนุญาตให้ใช้เพื่อการตลาดและประกอบเอกสาร GACP ของลูกค้า (28 ส.ค. 2026) ตามที่ 0824 กำหนดให้อนุมัติเป็นลายลักษณ์อักษร",
              "Farm and seed-production photos will be added after Green Future supplies the files. Julia authorised this use for marketing and customer GACP files (28 Aug 2026), matching the 0824 written-approval rule."
            )}
          </p>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/wholesale/gacp"
            className="inline-flex min-h-12 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {t("← โปรแกรมเมล็ดสำหรับฟาร์มใบอนุญาต", "← Licensed-farm seed programme")}
          </Link>
        </div>
      </section>
    </div>
  );
}
