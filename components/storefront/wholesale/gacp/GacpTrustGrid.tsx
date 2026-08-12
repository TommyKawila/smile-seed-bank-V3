"use client";

import { Dna, FileStack, Handshake, Layers } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const ITEMS = [
  {
    icon: Dna,
    titleTh: "ตรวจสอบย้อนกลับพันธุกรรม",
    titleEn: "Genetic Traceability",
    bodyTh: "สายพันธุ์ยืนยันต้นทาง ฟีโนไทป์เสถียร อ้างอิงด้วยรหัสพันธุ์เป็นหลัก",
    bodyEn: "Verified lineage and stable phenotypes — variety code as the primary reference.",
  },
  {
    icon: FileStack,
    titleTh: "เอกสารครบชุด",
    titleEn: "Full Documentation",
    bodyTh: "COA, รายงานแล็บ (โลหะหนัก / สารเคมี / ไมโคทอกซิน) และใบรับรองพืชกักกัน",
    bodyEn: "COA, lab reports (heavy metals, pesticides, mycotoxins), and phytosanitary certificates.",
  },
  {
    icon: Layers,
    titleTh: "ราคาขายส่ง B2B",
    titleEn: "B2B Bulk Pricing",
    bodyTh: "ราคาแบบขั้นบันไดสำหรับปริมาณเชิงพาณิชย์ พร้อมแพ็กเกจเอกสาร COA",
    bodyEn: "Competitive tiered pricing for commercial scales with optional COA document packages.",
  },
  {
    icon: Handshake,
    titleTh: "ที่ปรึกษาการปลูก",
    titleEn: "Cultivation Support",
    bodyTh: "คำปรึกษาเชิงเกษตรสำหรับฟาร์มที่ตั้งระบบ GACP",
    bodyEn: "Expert agronomic consulting for GACP farm setup and documentation readiness.",
  },
] as const;

export function GacpTrustGrid() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t(
            "ทำไมเลือก Smile Seed Bank สำหรับ GACP",
            "Why Choose Smile Seed Bank for GACP?"
          )}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {t(
            "ออกแบบมาสำหรับฟาร์มใบอนุญาตที่ต้องการเมล็ดพร้อมเอกสาร ไม่ใช่แค่ราคาขายส่ง",
            "Built for licensed farms that need document-ready genetics — not wholesale price alone."
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
