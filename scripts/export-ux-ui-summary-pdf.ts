/**
 * Generates Smile Seed Bank V3 UX/UI configuration summary PDF (Thai + EN labels).
 * Run: npx tsx scripts/export-ux-ui-summary-pdf.ts
 */
import fs from "node:fs";
import path from "node:path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { loadPromptFontBase64ForJsPdf } from "../lib/prompt-font-loader";

const BRAND = [18, 70, 62] as const;
const OUT_DIR = path.join(process.cwd(), "exports");
const OUT_FILE = path.join(OUT_DIR, "Smile-Seed-Bank-V3-UX-UI-Summary.pdf");

function registerFont(doc: jsPDF, b64: string) {
  doc.addFileToVFS("Prompt-Regular.ttf", b64);
  doc.addFont("Prompt-Regular.ttf", "Prompt", "normal");
  doc.setFont("Prompt", "normal");
}

function header(doc: jsPDF, title: string, page: number) {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, 210, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("Smile Seed Bank V3", 14, 8);
  doc.setFontSize(9);
  doc.text(title, 14, 14);
  doc.setFontSize(8);
  doc.text(String(page), 196, 14, { align: "right" });
  doc.setTextColor(40, 40, 40);
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.text(text, 14, y);
  doc.setTextColor(40, 40, 40);
  return y + 6;
}

function bodyText(doc: jsPDF, y: number, lines: string[], maxW = 182): number {
  doc.setFontSize(9);
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxW);
    for (const w of wrapped) {
      if (y > 285) {
        doc.addPage();
        y = 28;
      }
      doc.text(w, 14, y);
      y += 4.5;
    }
  }
  return y + 2;
}

async function main() {
  const fontB64 = await loadPromptFontBase64ForJsPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc, fontB64);

  const iso = new Date().toISOString().slice(0, 10);
  let page = 1;
  header(doc, "UX / UI Configuration Summary", page);

  let y = 28;
  y = sectionTitle(doc, y, "เอกสารนำเสนอ — ค่ากำหนด UX/UI หน้าร้าน");
  y = bodyText(doc, y, [
    `วันที่จัดทำ: ${iso}`,
    "โปรเจกต์: Smile Seed Bank V3 · Premium Eco-Clinical (Teal + Lavender)",
    "Blueprint: docs/blueprint/5_UI_UX_DESIGN_SYSTEM.md · 7_A11Y_CHECKLIST.md",
  ]);

  y = sectionTitle(doc, y, "1. Design System (สี · ฟอนต์ · มุมโค้ง)");
  autoTable(doc, {
    startY: y,
    head: [["Token", "ค่า", "การใช้งาน"]],
    body: [
      ["Primary (Teal)", "HSL 162 70% 22%", "ปุ่มหลัก · ring · accent"],
      ["Secondary (Lavender)", "HSL 255 55% 90%", "Indica · premium sections"],
      ["Sativa bar", "HSL 158 95% 45%", "Genetic bar Sativa"],
      ["Background", "White", "พื้นหลัง storefront"],
      ["Border radius", "0.75rem", "ปุ่ม · card"],
      ["Font", "Prompt + Noto Sans Thai", "ทั้งเว็บ (sans เดียว)"],
    ],
    styles: { font: "Prompt", fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  y = sectionTitle(doc, y, "2. Accessibility (มาตรฐาน)");
  y = bodyText(doc, y, [
    "• Touch target ขั้นต่ำ 48×48 px · ระยะห่างปุ่ม ≥ 8 px",
    "• ปุ่ม submit ฟอร์ม min-h-12",
    "• focus-visible: ring 2px + offset",
    "• Product card: ลิงก์หลัก 1 อันต่อการ์ด (stretched link)",
    "• Carousel: prev/next + dot มี aria-label",
  ]);

  doc.addPage();
  page += 1;
  header(doc, "UX / UI Configuration Summary", page);
  y = 28;

  y = sectionTitle(doc, y, "3. หน้าแรก — ลำดับ Section");
  autoTable(doc, {
    startY: y,
    head: [["Key", "TH label (default)", "EN label"]],
    body: [
      ["hero", "แบนเนอร์หลัก", "Hero"],
      ["categories", "เลือกสไตล์การปลูก", "Find your grow style"],
      ["breeder_showcase", "บรีดเดอร์ยอดนิยม (Top 8)", "Top Breeders"],
      ["clearance", "คลังล้างสต็อก", "Clearance Vault"],
      ["blog", "คลังความรู้ / บทความ", "Blog / Insights"],
      ["featured", "สายพันธุ์เด่น", "Featured strain hero"],
      ["breeders", "บรีดเดอร์ลิส", "Breeder Directory"],
      ["trust", "จุดเด่นร้าน (3 คอล.)", "Trust highlights"],
      ["new_strains", "สายพันธุ์มาใหม่", "New arrivals"],
      ["newsletter", "แบนเนอร์สมัครสมาชิก", "Newsletter"],
    ],
    styles: { font: "Prompt", fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  y = bodyText(doc, y, ["Admin ปรับ label / เปิด-ปิด section ผ่านตาราง homepage_sections"]);

  y = sectionTitle(doc, y, "4. Hero — Layout & Copy");
  autoTable(doc, {
    startY: y,
    head: [["รายการ", "ค่า"]],
    body: [
      ["Mobile aspect", "392 × 429 (portrait)"],
      ["Desktop aspect", "617 × 712"],
      ["Desktop layout", "Grid 2 คอลัมน์ — ข้อความซ้าย · รูปขวา"],
      ["H1 (TH)", "คัดสรรพันธุกรรมระดับโลก สู่มือคุณ"],
      ["Eyebrow", "EST. 2018 // ร้านเมล็ดพันธุ์แห่งรอยยิ้มยุคแรกของไทย"],
    ],
    styles: { font: "Prompt", fontSize: 8 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.addPage();
  page += 1;
  header(doc, "UX / UI Configuration Summary", page);
  y = 28;

  y = sectionTitle(doc, y, "5. Hero CTA ปุ่ม (default)");
  autoTable(doc, {
    startY: y,
    head: [["ปุ่ม TH", "สี", "ลิงก์"]],
    body: [
      ["เมล็ดพันธุ์ทั้งหมด", "green (Teal)", "/seeds"],
      ["เมล็ดพันธุ์มาใหม่", "outline", "/shop?sort=new_arrivals"],
      ["เมล็ดพันธุ์ลดราคา", "outline", "/seeds?quick=clearance"],
      ["บทความน่าสนใจ", "outline", "/blog"],
    ],
    styles: { font: "Prompt", fontSize: 8 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  y = sectionTitle(doc, y, "6. Hero Carousel — Performance");
  autoTable(doc, {
    startY: y,
    head: [["พารามิเตอร์", "ค่า"]],
    body: [
      ["Autoplay interval", "5 วินาที"],
      ["เริ่ม autoplay", "หลัง 20 วินาที (LCP slide 0)"],
      ["Fade slide 2+", "0.8s hero-fade-in"],
      ["LCP quality mobile / desktop", "32 / 50"],
      ["Other slides quality", "55"],
      ["Slide 0", "priority + fetchPriority high"],
    ],
    styles: { font: "Prompt", fontSize: 8 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  y = sectionTitle(doc, y, "7. Hero Banners (Admin /admin/banners)");
  y = bodyText(doc, y, [
    "• Desktop TH บังคับ · Mobile/EN fallback ไป TH",
    "• อัปโหลด ratio Desktop 617:712 · Mobile 392:429 (WebP/PNG)",
    "• Desktop object-cover · Mobile object-contain",
    "• panelBgHex — สีพื้นหลังเมื่อ ratio ไม่ตรงกรอบ",
    "• Schedule starts_at / ends_at · drag เรียงลำดับ",
    "• hero_bg_mode (site settings): static_image | video | animated_svg",
  ]);

  doc.addPage();
  page += 1;
  header(doc, "UX / UI Configuration Summary", page);
  y = 28;

  y = sectionTitle(doc, y, "8. LINE LIFF — Chat Bar → Auto-login → /shop");
  autoTable(doc, {
    startY: y,
    head: [["รายการ", "ค่า"]],
    body: [
      ["LIFF app", "Smile Seed Bank"],
      ["LIFF ID (env)", "NEXT_PUBLIC_LIFF_ID = 2008810845-iA0GWHXV"],
      ["Endpoint URL", "https://www.smileseedbank.com/line/entry"],
      ["Scope", "profile + openid"],
      ["Redirect default", "/shop (?next= สำหรับ path ภายใน)"],
      ["Flow", "liff.init → login → POST /api/line/liff/session → Supabase session"],
    ],
    styles: { font: "Prompt", fontSize: 8 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  y = sectionTitle(doc, y, "9. LIFF UX States");
  autoTable(doc, {
    startY: y,
    head: [["State", "UI"]],
    body: [
      ["Loading", "Spinner emerald + กำลังเข้าสู่ร้าน…"],
      ["นอก LINE app", "เปิดจากแชท LINE + ปุ่มไป OA"],
      ["Login fail", "ลองใหม่ / เปิดร้าน (openExternalBrowser=1)"],
    ],
    styles: { font: "Prompt", fontSize: 8 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  y = sectionTitle(doc, y, "10. Environment Variables (UX-related)");
  autoTable(doc, {
    startY: y,
    head: [["Variable", "ใช้กับ"]],
    body: [
      ["NEXT_PUBLIC_SITE_URL", "Canonical domain · LIFF endpoint"],
      ["NEXT_PUBLIC_LIFF_ID", "LIFF init (Smile Seed Bank app)"],
      ["NEXT_PUBLIC_LINE_OA_URL", "ลิงก์เข้าแชท OA"],
      ["NEXT_PUBLIC_SHIPPING_FEE", "ค่าจัดส่ง (default 50)"],
      ["NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD", "ฟรี ship (default 1000)"],
    ],
    styles: { font: "Prompt", fontSize: 8 },
    headStyles: { fillColor: BRAND, font: "Prompt", fontStyle: "normal" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  y = sectionTitle(doc, y, "11. สรุป — กำหนดค่าที่ไหน");
  y = bodyText(doc, y, [
    "• สี / ฟอนต์ / radius → globals.css + Blueprint",
    "• Hero ข้อความ + CTA → Admin homepage / DB",
    "• Hero รูปสไลด์ → /admin/banners (Home banners)",
    "• Section หน้าแรก → homepage_sections (DB)",
    "• LIFF chat bar → LINE Developers + OA Manager Chat bar",
    "• ภาษา TH/EN → LanguageContext ทุกหน้า",
  ]);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Smile Seed Bank V3 · Confidential internal summary", 105, 290, { align: "center" });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const buf = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(OUT_FILE, buf);
  console.log(`PDF written: ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
