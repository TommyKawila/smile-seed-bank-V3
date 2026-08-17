export type PlanLocale = "th" | "en";

export const COLLABORATION_PLAN_SHARE_PATH = "/share/green-future/plan";

type PlanCopy = {
  kicker: string;
  title: string;
  project: string;
  partnersTitle: string;
  partners: string[];
  objectiveTitle: string;
  objective: string;
  dutiesTitle: string;
  dutiesIntro: string;
  gfTitle: string;
  gfSubtitle: string;
  gfItems: string[];
  ssbTitle: string;
  ssbSubtitle: string;
  ssbItems: string[];
  workflowTitle: string;
  phases: { n: string; title: string; items: string[] }[];
  summaryTitle: string;
  summary: string;
  openTitle: string;
  openIntro: string;
  openItems: string[];
  statusNote: string;
};

export const COLLABORATION_PLAN: Record<PlanLocale, PlanCopy> = {
  th: {
    kicker: "แผนงานความร่วมมือ · เมล็ดพันธุ์ควบคุม (ฉบับร่าง)",
    title: "แผนงานความร่วมมือทางธุรกิจ",
    project:
      "ผลิต บรรจุ และจัดจำหน่ายเมล็ดพันธุ์กัญชาควบคุมตามข้อกำหนดกรมวิชาการเกษตร พร้อมเอกสารตรวจสอบย้อนกลับเพื่อประกอบเอกสาร GACP ของลูกค้า — ไม่สื่อว่าเมล็ดได้รับการรับรอง GACP",
    partnersTitle: "ผู้ร่วมโครงการ",
    partners: [
      "Green Future (Global) Co., Ltd. — ผู้ถือใบอนุญาตรวบรวมเมล็ดพันธุ์ควบคุม พ.พ.3 เลขที่ 102001102568 (ใบรับรอง GACP เป็นของสถานที่ผลิต ไม่ใช่ของล็อตเมล็ด)",
      "หจก. ทีเอ็มวาย อะโกร เทรด (T.M.Y Agro Trade Limited Partnership) ดำเนินการภายใต้แบรนด์ Smile Seed Bank — ผู้ถือใบอนุญาตขายเมล็ดพันธุ์ควบคุม พ.พ.4 เลขที่ 1011043900042568",
    ],
    objectiveTitle: "เป้าหมายหลัก",
    objective:
      "ผลิต บรรจุ และจัดจำหน่ายเมล็ดพันธุ์ควบคุมตามข้อกำหนดกรมวิชาการเกษตร โดยใช้เอกสารตรวจสอบย้อนกลับแบบดิจิทัลเป็นเอกสารสนับสนุนให้ลูกค้าฟาร์มใบอนุญาตใส่ในระบบของตนเอง — ไม่ใช่ใบรับรอง GACP เอกสาร DTAM หรือการันตีผลการตรวจ",
    dutiesTitle: "การแบ่งขอบเขตความรับผิดชอบ",
    dutiesIntro:
      "แบ่งหน้าที่ตามขอบเขตใบอนุญาตที่ตรวจสอบแล้วของแต่ละฝ่าย โดยคำนึงถึงข้อกำหนดเพิ่มเติมของกิจกรรม สถานที่ หรือสินค้า ไม่ได้ตัดทับซ้อนทางกฎหมายทั้งหมดโดยอัตโนมัติ",
    gfTitle: "Green Future — ผู้ผลิตและรวบรวม (พ.พ. 3)",
    gfSubtitle: "ต้นน้ำ: เพาะพันธุ์จนถึงบรรจุซองปิดผนึก",
    gfItems: [
      "ควบคุมการปลูก ผสมเกสร และเก็บเกี่ยวเมล็ดให้ได้คุณภาพ ที่สถานที่ได้รับใบอนุญาต",
      "ทดสอบอัตราการงอกและความบริสุทธิ์ต่อล็อต ระบุเลขล็อตและวันที่ทดสอบ — แล็บภายนอกหรือ ISTA คิดแยกตามรายการราคา B2B หากไม่มีแล็บนอก ตัวเลขมาจาก protocol ภายในของ Green Future",
      "บรรจุลงซองทึบแสงของแบรนด์ Smile Seed Bank และติดฉลากตามที่ตกลง — Smile ต้องไม่แกะ แบ่ง บรรจุใหม่ หรือเปลี่ยนฉลากโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษร (เงื่อนไขสัญญา)",
      "ส่งข้อมูลเท่าที่จำเป็นต่อการตรวจสอบย้อนกลับ: รหัสพันธุ์ ชื่อการค้า เลขล็อต ผลทดสอบ และข้อมูลที่ตกลง — ไม่เปิดสายพ่อแม่พันธุ์หรือสมุดเพาะพันธุ์เต็ม",
    ],
    ssbTitle: "หจก. ทีเอ็มวาย อะโกร เทรด — ผู้จัดจำหน่ายและเทคโนโลยี (พ.พ. 4)",
    ssbSubtitle: "ปลายน้ำ: การตลาดและระบบสนับสนุนเอกสาร ภายใต้แบรนด์ Smile Seed Bank",
    ssbItems: [
      "ขายผ่านเว็บไซต์และช่องทางที่ถูกกฎหมาย โดยคงหีบห่อเดิมที่ปิดผนึกจากผู้ผลิต และเก็บของที่ตั้งตามใบ พ.พ.4 ของหจก.",
      "จัดเตรียมงานออกแบบซองและเลย์เอาต์ฉลากให้ Green Future ใช้ตอนบรรจุ — งานพิมพ์จริงหลังอนุมัติสองฝ่าย ฉลากกฎหมายต้องมีชื่อหจก. เลข พ.พ.4 และที่ตั้งตามใบ แบรนด์ Smile เป็นส่วนการค้า",
      "พัฒนา Traceability Pack Generator ให้ลูกค้าฟาร์มดาวน์โหลด PDF ได้เอง (ยังไม่เปิดใช้) — ฟิลด์ล็อตของ Green Future ห้ามแก้ มีเลขเวอร์ชัน วันเวลา และ audit trail",
      "ช่วยเรื่องการใช้เอกสารเมล็ดประกอบแฟ้มของลูกค้า ไม่เสนอตัวเป็น DTAM หรือผู้รับรอง และไม่การันตีผลการตรวจ GACP — ที่ปรึกษาออดิทฟาร์มเป็นบริการแยกของ Green Future",
    ],
    workflowTitle: "ขั้นตอนการปฏิบัติงานร่วมกัน",
    phases: [
      {
        n: "1",
        title: "การเตรียมการ",
        items: [
          "Smile Seed Bank: รีเสิร์ชความต้องการฟาร์มใบอนุญาต และตกลงรายชื่อสายพันธุ์กับ Green Future (ลิสต์มีเวอร์ชัน/วันที่ ไม่ใช่สต็อกถาวร ขายได้หลัง Green Future ยืนยันรายการ)",
          "Green Future: ยืนยันความพร้อมวัสดุพันธุ์ และหน้าต่างเก็บเกี่ยวโดยประมาณ — วันส่งของแน่นอนเมื่อมีล็อตพร้อมหรือออเดอร์ที่ยืนยันแล้ว",
          "ร่วมกัน: สรุปรูปแบบซองและเทมเพลตฉลากเป็นภาคผนวกที่มีเวอร์ชัน ฟิลด์บังคับตามกรมฯ ต้องตรวจก่อนพิมพ์ อย่าสมมติว่าต้องมีเลขใบอนุญาตทั้งสองฝ่ายจนกว่าจะยืนยันข้อกำหนดฉลาก",
        ],
      },
      {
        n: "2",
        title: "การผลิตและการทดสอบ (Green Future)",
        items: [
          "ปลูก รวบรวม และทำความสะอาดเมล็ด ที่สถานที่ได้รับใบอนุญาต พร้อมบันทึกล็อตที่เชื่อมไปยังล็อตที่ส่งมอบ",
          "เป้าเชิงพาณิชย์: งอก >80% ความบริสุทธิ์ >99% — ขั้นต่ำตามกฎเมล็ดควบคุมคืองอก 70% ความบริสุทธิ์ 99% เกณฑ์รับของผูกพันต้องตกลงแยกในคำสั่งซื้อ ไม่เรียกว่ามาตรฐาน GACP",
          "บันทึกวันที่เก็บเกี่ยว วันที่ทดสอบ และช่วงแนะนำใช้หรือวันทดสอบซ้ำ — วันหมดอายุต้องยืนยันตามกฎฉลากและความรับผิดชอบการเก็บหลังส่งมอบเป็นของ Smile",
        ],
      },
      {
        n: "3",
        title: "การบรรจุและการส่งมอบ",
        items: [
          "Green Future: พิมพ์ฉลาก (lot) แปะซอง บรรจุ ซีล และจัดส่ง พร้อมบันทึกการรับสินค้า",
          "Green Future: ส่งข้อมูลล็อตตามเทมเพลตควบคุม (SKU รหัส ชื่อการค้า lot ขนาดซอง งอก บริสุทธิ์ วันที่ทดสอบ) — PDF ที่เซ็นมาก่อนไฟล์ Excel/CSV ที่แก้ได้",
        ],
      },
      {
        n: "4",
        title: "การจัดจำหน่ายและเอกสารสนับสนุน (Smile Seed Bank)",
        items: [
          "นำเข้าข้อมูลล็อตลงฐานข้อมูล ฟิลด์จาก Green Future เป็นอ่านอย่างเดียว การแก้ต้องมีแหล่งเอกสารและ audit trail",
          "นำสินค้าขึ้นเว็บตามคำอธิบายและสต็อกที่อนุมัติ — ห้ามใช้ชื่อ Green Future เป็นแหล่งคำโฆษณาที่ยังไม่อนุมัติ",
          "ลูกค้าฟาร์มกรอกเลขล็อตแล้วดาวน์โหลด Traceability Pack สำหรับใส่ในระบบตรวจสอบย้อนกลับของตนเอง ตามที่ผู้มีอำนาจ/ผู้ตรวจกำหนด — PDF นี้ไม่ใช่ใบรับรอง GACP",
        ],
      },
    ],
    summaryTitle: "บทสรุป",
    summary:
      "แต่ละฝ่ายเป็นผู้รับเหมาอิสระ รับผิดชอบใบอนุญาต บุคลากร การดำเนินงาน และข้อความของตนเอง Green Future โฟกัสการเกษตรและคุณภาพเมล็ด หจก. ทีเอ็มวาย อะโกร เทรด (แบรนด์ Smile Seed Bank) โฟกัสช่องทางขาย ระบบเอกสาร และการตลาด",
    openTitle: "เรื่องที่ยังเปิดอยู่ก่อนอนุมัติสุดท้าย",
    openIntro: "เอกสารนี้เป็นฉบับเบื้องต้น ไม่ใช่สัญญาจัดจำหน่าย",
    openItems: [
      "สำเนา พ.พ.4 ของหจก. และคำชี้แจงเลขใบอนุญาตสองชุด (ใบร้านออนไลน์เดิม vs ใบหจก.)",
      "เทมเพลตฉลากสุดท้ายและฟิลด์บังคับตามกรมฯ",
      "เกณฑ์คุณภาพเชิงพาณิชย์ที่ผูกพัน (เป้า 80/99 vs ขั้นต่ำกฎหมาย 70/99)",
      "เทมเพลต Traceability Pack และกฎการเข้าถึง",
      "ขอบเขตข้อมูลที่ Green Future จะเปิด",
      "ขั้นตอนตรวจสอบลูกค้าและการขายถูกกฎหมายของ Smile",
      "เงื่อนไขเก็บเมล็ดหลังส่งมอบ",
      "เทมเพลตบันทึกแบทช์และการเชื่อมล็อตผลิตกับล็อตส่งมอบ",
      "ขั้นตอนเคลม",
      "สัญญา B2B Distribution & Compliance ฉบับสุดท้าย",
    ],
    statusNote: "สถานะ: ร่างสำหรับหารือ · Ref. GF/SSB/2026-0815",
  },
  en: {
    kicker: "Collaboration plan · controlled seed (draft)",
    title: "Business Collaboration Plan",
    project:
      "Production, packaging and distribution of controlled cannabis seeds in accordance with applicable DOA requirements, with traceability documentation supporting the customer’s GACP documentation — this does not mean the seeds themselves are GACP-certified.",
    partnersTitle: "Parties",
    partners: [
      "Green Future (Global) Co., Ltd. — licensed collector of controlled seeds, Por.Por. 3 No. 102001102568 (Thailand Cannabis GACP certificate covers the production site, not a seed lot).",
      "T.M.Y Agro Trade Limited Partnership, trading as Smile Seed Bank — licensed seller of controlled seeds, Por.Por. 4 No. 1011043900042568.",
    ],
    objectiveTitle: "Objective",
    objective:
      "To produce, package and distribute controlled cannabis seeds under Department of Agriculture requirements, using a digital Traceability Pack as supporting documentation for licensed farms’ own files — not as a GACP certificate, DTAM document, or a guarantee of passing an audit.",
    dutiesTitle: "Allocation of responsibilities",
    dutiesIntro:
      "Roles follow the verified scope of each party’s licences, taking into account extra requirements for the activity, premises or product. This split does not automatically remove every legal overlap.",
    gfTitle: "Green Future — producer and collector (Por.Por. 3)",
    gfSubtitle: "Upstream: selection through sealed packaging",
    gfItems: [
      "Control cultivation, pollination and harvest for seed quality at the licensed site.",
      "Test germination and purity per lot, stating lot number and test date. Independent laboratory or ISTA testing is charged separately on the B2B price list. If no external test was done, figures follow Green Future’s internal protocol.",
      "Fill opaque Smile Seed Bank pouches and apply agreed labels. Smile must not open, split, repack or relabel without prior written consent (contractual condition).",
      "Provide the minimum data needed for traceability: variety code, commercial name, lot number, test results and other agreed fields — not full parental lines or breeding records.",
    ],
    ssbTitle: "T.M.Y Agro Trade — distributor and technology (Por.Por. 4)",
    ssbSubtitle: "Downstream: marketing and document support under the Smile Seed Bank brand",
    ssbItems: [
      "Sell through lawful channels, keeping the producer’s original sealed packs, and store goods at the premises on the partnership Por.Por. 4.",
      "Supply pouch design and label layout for Green Future to pack. Printing only after written approval by both parties. The legal label must show the partnership name, Por.Por. 4 number and licensed address; Smile Seed Bank is the commercial brand.",
      "Build a Traceability Pack Generator so farm customers can download PDFs (not launched yet). Green Future lot fields must be read-only, with version, timestamp and an audit trail.",
      "Advise on using seed documents in the customer’s own file. Smile is not DTAM or a certification body and does not guarantee a GACP outcome. Farm-audit consulting is a separate Green Future service.",
    ],
    workflowTitle: "Joint workflow",
    phases: [
      {
        n: "1",
        title: "Preparation",
        items: [
          "Smile Seed Bank: research licensed-farm demand and agree a dated variety list with Green Future. The list is not standing stock. Sales only after Green Future’s written confirmation for the item.",
          "Green Future: confirm parent-material availability and an estimated harvest window. A firm delivery date exists only for a released lot or an accepted supply order.",
          "Together: lock pouch format and label template as a versioned appendix. Do not assume both parties’ licence numbers are mandatory until current DOA labelling rules for this model are checked.",
        ],
      },
      {
        n: "2",
        title: "Production and testing (Green Future)",
        items: [
          "Grow, collect and clean seed at the licensed site, with a batch record linked to the released lot.",
          "Commercial target: germination >80% and purity >99%. The confirmed regulatory minimum for controlled cannabis/hemp seed is 70% germination and 99% purity. Binding acceptance criteria are set per order. These figures are not a “GACP standard.”",
          "Record harvest date, test date, and a recommended-use or retest period. An expiry field needs separate confirmation under labelling rules. After delivery, storage conditions are Smile’s responsibility.",
        ],
      },
      {
        n: "3",
        title: "Packaging and delivery",
        items: [
          "Green Future: print lot labels, apply them, fill, seal and dispatch, with an acceptance record.",
          "Green Future: deliver lot data on a controlled template (SKU, code, commercial name, lot, pack size, germination, purity, test date). A signed Green Future PDF prevails over an editable Excel/CSV file.",
        ],
      },
      {
        n: "4",
        title: "Distribution and supporting documents (Smile Seed Bank)",
        items: [
          "Import lot data with Green Future fields read-only. Corrections need a source document and an audit trail.",
          "List products from approved descriptions and current availability. Green Future’s name must not be used as the source of unapproved claims.",
          "Farm customers enter a lot number and download a Traceability Pack for their own traceability system and GACP documentation, subject to the competent authority or auditor. The PDF is not a GACP certificate.",
        ],
      },
    ],
    summaryTitle: "Summary",
    summary:
      "The parties are independent contractors. Each is responsible for its own licences, staff, operations and statements. Green Future focuses on agronomy and seed quality. T.M.Y Agro Trade Limited Partnership (trading as Smile Seed Bank) focuses on sales channels, document systems and marketing.",
    openTitle: "Open matters before final approval",
    openIntro: "This document is preliminary. It is not the Distribution & Compliance Agreement.",
    openItems: [
      "Smile’s valid Por.Por. 4 for the partnership and an explanation of the two licence numbers (historic shop licence vs partnership licence)",
      "Final label template and mandatory DOA fields",
      "Final commercial quality specification (80/99 target vs 70/99 legal floor as binding acceptance)",
      "Traceability Pack template and access rules",
      "Scope of Green Future data to be disclosed",
      "Smile’s customer-verification and lawful-sales procedure",
      "Post-delivery seed-storage conditions",
      "Batch-record template and linkage between production batch and released lot",
      "Claims procedure",
      "Final B2B Distribution & Compliance Agreement",
    ],
    statusNote: "Status: draft for discussion · Ref. GF/SSB/2026-0815",
  },
};

export function collaborationPlanSharePath(locale: PlanLocale): string {
  return locale === "en"
    ? `${COLLABORATION_PLAN_SHARE_PATH}?lang=en`
    : COLLABORATION_PLAN_SHARE_PATH;
}
