"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

/** Seed claim form — preview until Regulatory Gate */
const SEED_CLAIM_FORM_HREF = "/claim/seeds";

export function WholesaleComplianceNotice() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t(
            "ข้อมูลสำคัญสำหรับลูกค้าขายส่ง",
            "Important information for wholesale customers"
          )}
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
          <li>
            {t(
              "ราคาบนหน้าเว็บเป็นการประมาณการ — ราคาผูกพันเมื่อยืนยันในใบเสนอราคาเท่านั้น",
              "Prices shown are indicative estimates — binding only when confirmed in a quotation."
            )}
          </li>
          <li>
            {t(
              "เมล็ดบรรจุและซีลโดยผู้ผลิต (SGF SEEDS) — Smile Seed Bank ไม่เปิด แบ่ง หรือเปลี่ยนฉลากโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
              "Seeds are producer-packed and sealed (SGF SEEDS) — Smile Seed Bank does not open, repack, or relabel without prior written consent."
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
              "การเริ่มนับระยะเวลาการรับประกันการงอกของเมล็ดคือ 30 วันหลังจากสินค้าถึงมือผู้รับ",
              "The germination warranty period starts 30 days after the goods are received by the customer."
            )}
          </li>
          <li>
            {t(
              "การจัดเก็บเมล็ดที่เหมาะสมเพื่อคงอัตราการงอกในระยะยาว: หลีกเลี่ยงแสงแดด · เก็บในตู้เย็น 5–10°C · ความชื้นสัมพัทธ์ (RH) ไม่เกิน 50%",
              "Proper seed storage for long-term viability: keep out of direct sunlight · store at 5–10°C (refrigerator) · relative humidity (RH) not exceeding 50%."
            )}
          </li>
          <li>
            {t(
              "ฉลากเมล็ดพันธุ์ควบคุมต้องตรงตัวอย่างกรมวิชาการเกษตร — กรมฯ ไม่ประทับอนุมัติฉลากเป็นลายลักษณ์อักษร",
              "Controlled seed labels must follow the Department of Agriculture reference — DOA does not formally approve individual label designs."
            )}
          </li>
          <li>
            {t(
              "ขั้นตอนการขอเคลมเมล็ด (preview): กรอกข้อมูลในฟอร์มเคลมเมล็ดบนเว็บให้ครบถ้วนที่",
              "Seed claim process (preview): complete the online seed claim form"
            )}{" "}
            <Link
              href={SEED_CLAIM_FORM_HREF}
              className="font-medium text-emerald-700 underline-offset-4 hover:underline"
            >
              {t("ที่นี่", "here")}
            </Link>
            {t(
              " — ทีมจะติดต่อหลังตรวจสอบเอกสารตามเงื่อนไขในใบเสนอราคา",
              " — our team will follow up after reviewing documents per the quotation terms."
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
