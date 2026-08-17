"use client";

import { Dna, FileStack, Handshake, Layers } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const ITEMS = [
  {
    icon: Dna,
    titleTh: "ระบุพันธุ์ด้วยรหัสล็อต",
    titleEn: "Variety code and lot identity",
    bodyTh: "อ้างอิงรหัสพันธุ์ ชื่อการค้า และเลขล็อตตามที่ผู้ผลิตยืนยัน — ไม่เปิดสายพ่อแม่พันธุ์เต็ม",
    bodyEn: "Commercial name, variety code, and lot number as confirmed by the producer — full pedigree is not disclosed.",
  },
  {
    icon: FileStack,
    titleTh: "เอกสารสนับสนุนตามล็อต",
    titleEn: "Lot supporting documents",
    bodyTh: "ข้อมูลทดสอบต่อล็อตตามที่สั่ง แล็บภายนอกหรือ ISTA คิดแยก ไม่แถมทุกล็อต",
    bodyEn: "Per-lot test data as ordered. Independent lab or ISTA tests are billed separately and are not included on every lot.",
  },
  {
    icon: Layers,
    titleTh: "ราคาขายส่ง B2B",
    titleEn: "B2B bulk pricing",
    bodyTh: "ราคาแบบขั้นบันไดสำหรับปริมาณเชิงพาณิชย์ ชุดเอกสารตามล็อตที่ยืนยัน",
    bodyEn: "Tiered pricing for commercial volumes. Document packs follow the confirmed lot — not a blanket certificate.",
  },
  {
    icon: Handshake,
    titleTh: "ช่วยเรื่องการใช้เอกสาร",
    titleEn: "Document-use support",
    bodyTh: "แนะนำการใส่เอกสารเมล็ดในแฟ้มของฟาร์ม ไม่เสนอตัวเป็น DTAM หรือผู้รับรอง และไม่การันตีผลการตรวจ GACP",
    bodyEn: "Help using seed documents in the farm’s own file. We are not DTAM or a certification body and do not guarantee a GACP audit result.",
  },
] as const;

export function GacpTrustGrid() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t(
            "ทำไมเลือก Smile Seed Bank สำหรับฟาร์มใบอนุญาต",
            "Why licensed farms work with Smile Seed Bank"
          )}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {t(
            "ออกแบบมาสำหรับฟาร์มใบอนุญาตที่ต้องการเอกสารล็อตประกอบแฟ้มของตนเอง ไม่ใช่แค่ราคาขายส่ง",
            "Built for licensed farms that need lot documents for their own file — not wholesale price alone."
          )}
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.titleEn}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {t(item.titleTh, item.titleEn)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {t(item.bodyTh, item.bodyEn)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
