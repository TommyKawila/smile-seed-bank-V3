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
};

export const COLLABORATION_PLAN: Record<PlanLocale, PlanCopy> = {
  th: {
    kicker: "แผนงานความร่วมมือ · เมล็ดพันธุ์มาตรฐาน GACP",
    title: "แผนงานความร่วมมือทางธุรกิจ",
    project: "โครงการผลิตและจัดจำหน่ายเมล็ดพันธุ์กัญชามาตรฐาน GACP",
    partnersTitle: "ผู้ร่วมโครงการ",
    partners: [
      "บริษัท Green Future — ผู้ถือใบอนุญาต รวบรวมเมล็ดพันธุ์ควบคุมฯ พ.พ. 3",
      "Smile Seed Bank — ผู้ถือใบอนุญาต ขายเมล็ดพันธุ์ควบคุมฯ พ.พ. 4",
    ],
    objectiveTitle: "เป้าหมายหลัก",
    objective:
      "เพื่อผลิต บรรจุ และจัดจำหน่ายเมล็ดพันธุ์กัญชาที่ถูกต้องตามกฎหมายกรมวิชาการเกษตร พร้อมระบบเอกสารตรวจสอบย้อนกลับ (Traceability Pack) แบบดิจิทัล เพื่อเจาะกลุ่มลูกค้าฟาร์มกัญชาที่ต้องการนำเมล็ดไปเพาะปลูกและขอรับรองมาตรฐาน Thailand Cannabis GACP",
    dutiesTitle: "การแบ่งขอบเขตความรับผิดชอบ",
    dutiesIntro:
      "แบ่งหน้าที่ตามประเภทใบอนุญาต เพื่อไม่ทับซ้อนทางกฎหมายและให้ทำงานคล่องตัว",
    gfTitle: "Green Future — ผู้ผลิตและรวบรวม (พ.พ. 3)",
    gfSubtitle: "ต้นน้ำ: เพาะพันธุ์จนถึงบรรจุซองปิดผนึก",
    gfItems: [
      "ควบคุมการปลูก ผสมเกสร และเก็บเกี่ยวเมล็ดให้ได้คุณภาพ",
      "ทดสอบอัตราการงอก (Germination) และความบริสุทธิ์ (Purity) ต่อลอต",
      "บรรจุลงซอง Smile Seed Bank (ทึบแสง) และติดฉลากตามกฎหมาย — ผู้ถือ พ.พ. 4 ไม่แกะแบ่งบรรจุเอง Green Future เป็นผู้บรรจุและซีลเท่านั้น",
      "ส่งข้อมูลสายพันธุกรรม (Lineage) และผลทดสอบแต่ละลอตให้ Smile Seed Bank",
    ],
    ssbTitle: "Smile Seed Bank — ผู้จัดจำหน่ายและเทคโนโลยี (พ.พ. 4)",
    ssbSubtitle: "ปลายน้ำ: การตลาดและระบบสนับสนุนลูกค้า GACP",
    ssbItems: [
      "ขายผ่านเว็บไซต์และหน้าร้าน โดยคงสภาพหีบห่อดั้งเดิมจากผู้ผลิต",
      "จัดเตรียมซองบรรจุภัณฑ์และเลย์เอาต์ฉลาก ส่งให้ Green Future ใช้ตอนบรรจุ",
      "พัฒนา Traceability Pack Generator ให้ลูกค้าฟาร์มดาวน์โหลด PDF ได้เอง",
      "ให้คำแนะนำเบื้องต้นเรื่องเอกสารเมล็ดพันธุ์ประกอบการยื่นขอ GACP",
    ],
    workflowTitle: "ขั้นตอนการปฏิบัติงานร่วมกัน",
    phases: [
      {
        n: "1",
        title: "R&D และการเตรียมการ",
        items: [
          "Smile Seed Bank: รีเสิร์ชความต้องการตลาดฟาร์ม GACP และกำหนดรายชื่อสายพันธุ์ร่วมกับ Green Future",
          "Green Future: ยืนยันความพร้อมแม่พันธุ์/พ่อพันธุ์ และกำหนดตารางเก็บเกี่ยว",
          "ร่วมกัน: สรุปรูปแบบซองและเทมเพลตฉลากตามกฎหมาย (ต้องมีชื่อ/เลขใบอนุญาตของทั้ง 2 ฝ่ายบนฉลาก)",
        ],
      },
      {
        n: "2",
        title: "การผลิตและการทดสอบ (Green Future)",
        items: [
          "ปลูก รวบรวม และทำความสะอาดเมล็ด",
          "ทดสอบความงอก (เป้าหมาย >80%) และความบริสุทธิ์ (เป้าหมาย >99%)",
          "บันทึกวันที่รวบรวม วันที่ทดสอบ และวันหมดอายุ",
        ],
      },
      {
        n: "3",
        title: "การบรรจุและการส่งมอบ",
        items: [
          "Green Future: พิมพ์ฉลาก (Lot Number) แปะซอง บรรจุเมล็ด ซีลปิดผนึก และจัดส่งสินค้าสำเร็จรูป",
          "Green Future: ส่งมอบ Batch Data (Excel/CSV หรือฟอร์ม) — สายพันธุ์, ผลงอก, ผลความบริสุทธิ์",
        ],
      },
      {
        n: "4",
        title: "การจัดจำหน่ายและระบบ GACP (Smile Seed Bank)",
        items: [
          "นำเข้า Batch Data ลงฐานข้อมูล",
          "นำสินค้าขึ้นจำหน่ายบนเว็บไซต์",
          "ลูกค้าฟาร์มกรอก Lot Number แล้วดาวน์โหลด Traceability Pack (PDF) สำหรับยื่นขอ GACP",
        ],
      },
    ],
    summaryTitle: "บทสรุปสำหรับผู้บริหาร",
    summary:
      "โมเดลนี้ใช้จุดแข็งของทั้งสองฝ่าย Green Future โฟกัสคุณภาพเมล็ดและการเกษตร Smile Seed Bank โฟกัส UX ระบบอัตโนมัติ และการตลาด ช่วยลดภาระเอกสารให้ลูกค้าฟาร์ม ซึ่งเป็นจุดแข็งที่คู่แข่งตามได้ยาก",
  },
  en: {
    kicker: "Collaboration Plan · GACP Seed Supply",
    title: "Business Collaboration Plan",
    project:
      "Production and distribution of cannabis seeds to GACP standard",
    partnersTitle: "Parties",
    partners: [
      "Green Future — licensed collector of controlled seeds (Por.Por. 3)",
      "Smile Seed Bank — licensed seller of controlled seeds (Por.Por. 4)",
    ],
    objectiveTitle: "Objective",
    objective:
      "To produce, pack, and distribute cannabis seeds in compliance with the Department of Agriculture, with a digital Traceability Pack, targeting licensed farms that need seed documentation for Thailand Cannabis GACP certification.",
    dutiesTitle: "Separation of duties",
    dutiesIntro:
      "Roles follow each licence type to avoid legal overlap and keep operations fast.",
    gfTitle: "Green Future — Producer & collector (Por.Por. 3)",
    gfSubtitle: "Upstream: breeding through sealed packaging",
    gfItems: [
      "Control cultivation, pollination, and harvest for seed quality",
      "Test germination and purity for each batch",
      "Fill Smile Seed Bank opaque pouches and apply legal labels — Por.Por. 4 holders must not open or re-pack; Green Future packs and seals only",
      "Hand off lineage and batch test results to Smile Seed Bank",
    ],
    ssbTitle: "Smile Seed Bank — Distributor & technology (Por.Por. 4)",
    ssbSubtitle: "Downstream: marketing and GACP customer support",
    ssbItems: [
      "Sell via website and storefront, keeping original sealed packs from the producer",
      "Supply pouch design and label layout for Green Future to use at packing",
      "Build a Traceability Pack Generator so farm customers can download PDFs themselves",
      "Advise customers on using seed documents for GACP applications",
    ],
    workflowTitle: "Joint workflow",
    phases: [
      {
        n: "1",
        title: "R&D and preparation",
        items: [
          "Smile Seed Bank: research GACP farm demand and agree a strain list with Green Future",
          "Green Future: confirm parent-stock readiness and harvest schedule",
          "Together: lock pouch format and legal label template (both parties’ names and licence numbers on the label)",
        ],
      },
      {
        n: "2",
        title: "Production and testing (Green Future)",
        items: [
          "Grow, collect, and clean seed",
          "Test germination (target >80%) and purity (target >99%)",
          "Record collection date, test date, and expiry",
        ],
      },
      {
        n: "3",
        title: "Packing and handoff",
        items: [
          "Green Future: print labels (lot number), apply to pouches, fill, seal, and ship finished goods",
          "Green Future: deliver batch data (Excel/CSV or form) — strain, germination, purity",
        ],
      },
      {
        n: "4",
        title: "Distribution and GACP system (Smile Seed Bank)",
        items: [
          "Import batch data into the database",
          "List products on the website",
          "Farm customers enter a lot number and download a Traceability Pack (PDF) for GACP filing",
        ],
      },
    ],
    summaryTitle: "Executive summary",
    summary:
      "This model uses each party’s strength. Green Future focuses on agronomy and seed quality. Smile Seed Bank focuses on UX, automation, and marketing — cutting paperwork for farm customers, which is hard for competitors to match.",
  },
};

export function collaborationPlanSharePath(locale: PlanLocale): string {
  return locale === "en"
    ? `${COLLABORATION_PLAN_SHARE_PATH}?lang=en`
    : COLLABORATION_PLAN_SHARE_PATH;
}
