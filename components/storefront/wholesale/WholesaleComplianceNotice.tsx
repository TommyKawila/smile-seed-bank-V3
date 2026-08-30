"use client";

import { useLanguage } from "@/context/LanguageContext";
import { gfGateNotice } from "@/lib/green-future-approved-marketing";

export function WholesaleComplianceNotice() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("ข้อมูลสำคัญสำหรับพาร์ทเนอร์ B2B", "Important information for B2B partners")}
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
          <li className="font-medium text-amber-900">{gfGateNotice(t)}</li>
          <li>
            {t(
              "ราคาบนหน้าเว็บเป็นการประมาณการ — ราคาผูกพันเมื่อยืนยันในใบเสนอราคาเท่านั้น",
              "Prices shown are indicative estimates — binding only when confirmed in a quotation."
            )}
          </li>
          <li>
            {t(
              "เมล็ดบรรจุและซีลโดยผู้ผลิต (Green Future) — Smile Seed Bank ไม่เปิด แบ่ง หรือเปลี่ยนฉลากโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
              "Seeds are producer-packed and sealed (Green Future) — Smile Seed Bank does not open, repack, or relabel without prior written consent."
            )}
          </li>
          <li>
            {t(
              "COA แล็บภายนอกและ ISTA เป็นบริการเสริม คิดแยกตามล็อต — ไม่รวมทุกออเดอร์",
              "External lab COA and ISTA testing are optional add-ons, charged separately per lot — not included on every order."
            )}
          </li>
          <li>
            {t(
              "เอกสารล็อตใช้สนับสนุนการตรวจสอบย้อนกลับสำหรับ GACP — ไม่ใช่ใบ GACP, เอกสาร DTAM หรือการรับประกันผลตรวจ",
              "Lot documents support traceability for GACP purposes — not a GACP certificate, DTAM document, or audit guarantee."
            )}
          </li>
          <li>
            {t(
              "เอกสารตรวจสอบย้อนกลับฉบับเต็มจัดให้ตามคำสั่งซื้อที่ยืนยัน",
              "Full traceability documents are issued with a confirmed order."
            )}
          </li>
          <li>
            {t(
              "เกณฑ์งอก ≥80% / บริสุทธิ์ ≥99% มีผลเมื่อระบุในใบเสนอราคาที่ยืนยัน และตามวิธีทดสอบที่ตกลง",
              "Germination ≥80% / purity ≥99% applies when stated in a confirmed quotation and per the agreed test method."
            )}
          </li>
          <li>
            {t(
              "การขายขึ้นกับการตรวจสอบใบอนุญาตลูกค้าและกฎหมายที่บังคับใช้ · จัดจำหน่ายโดย หจก. ทีเอ็มวาย อะโกร เทรด พ.พ.4 1011043900042568",
              "Sales subject to customer licence verification and applicable law · Distributed by T.M.Y Agro Trade Limited Partnership, Por.Por. 4 No. 1011043900042568."
            )}
          </li>
        </ul>
      </div>
    </section>
  );
}
