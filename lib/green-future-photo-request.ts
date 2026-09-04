/**
 * Photos requested from GF Seed Production & Handling Process deck
 * (Julia 4 Sep 2026 — pick from the presentation, per-image written approval + GF watermark).
 */

export const GF_PHOTO_PRESENTATION = {
  fileName: "gf-seed-production-process-th.pdf",
  titleTh: "กระบวนการผลิตและการจัดการเมล็ดพันธุ์",
  titleEn: "Seed Production & Handling Process",
} as const;

export type GfPhotoPick = {
  id: string;
  listItem: "A" | "B" | "C" | "D" | "E" | "F";
  slide: string;
  pdfPage: number;
  wantTh: string;
  wantEn: string;
};

export const GF_PHOTO_PICKS: GfPhotoPick[] = [
  {
    id: "a-exterior",
    listItem: "A",
    slide: "01 Facility & certification",
    pdfPage: 3,
    wantTh: "ภายนอกสถานที่ + ป้าย Green Future (มุมกว้าง)",
    wantEn: "Facility exterior and Green Future site signage (wide)",
  },
  {
    id: "e-gacp-cert",
    listItem: "E",
    slide: "01 Facility & certification",
    pdfPage: 3,
    wantTh: "ใบรับรอง TH GACP ติดที่สถานที่ (ถ้าอนุญาตถ่ายแยกไฟล์)",
    wantEn: "TH GACP certificate displayed on site (separate file if permitted)",
  },
  {
    id: "b-veg",
    listItem: "B",
    slide: "06 Vegetation & cultivation area",
    pdfPage: 9,
    wantTh: "โรงเรือนระยะเจริญเติบโต — มุมกว้าง 1 ภาพ + มุมปฏิบัติงาน 1 ภาพ",
    wantEn: "Vegetative cultivation — one wide shot and one working angle",
  },
  {
    id: "c-processing",
    listItem: "C",
    slide: "10 Quality control, counting & records",
    pdfPage: 13,
    wantTh:
      "พื้นที่ผลิต/แปรรูปเมล็ดภายในสถานที่ที่ได้รับการรับรอง GACP (ห้อง QC / packing มุมกว้าง)",
    wantEn:
      "Seed production/processing area within the GACP-certified production facility (QC / packing room, wide)",
  },
  {
    id: "d-packing",
    listItem: "D",
    slide: "11 Packing, lot identification & traceability",
    pdfPage: 14,
    wantTh: "จุดบรรจุ + ตัวอย่างฉลากล็อตบนถุงเมล็ด",
    wantEn: "Packing area plus example batch/lot label on a packed seed bag",
  },
  {
    id: "f-storage",
    listItem: "F",
    slide: "12 Seed storage & temperature control",
    pdfPage: 15,
    wantTh: "ตู้เก็บเมล็ด +5°C และจออุณหภูมิ (กันแสง)",
    wantEn: "Seed storage at +5°C with temperature display (light-protected)",
  },
];

export const GF_PHOTO_SKIP_TH =
  "ยังไม่ขอภาพ hygiene/UV, แช่เมล็ด, ดอกใกล้, หรือห้องน้ำปุ๋ย — ใช้ในแฟ้มกระบวนการได้ แต่ไม่เหมาะกับหน้าการตลาดรอบแรก";

export function gfPhotoPicksLetterEn(): string {
  return GF_PHOTO_PICKS.map(
    (p) =>
      `• ${p.listItem}. ${p.wantEn} — from “${p.slide}” (presentation page ${p.pdfPage})`
  ).join("\n");
}

export function gfPhotoPicksLetterTh(): string {
  return GF_PHOTO_PICKS.map(
    (p) =>
      `• ${p.listItem}. ${p.wantTh} — จากสไลด์ “${p.slide}” (หน้า ${p.pdfPage} ใน Presentation)`
  ).join("\n");
}

/** Short LINE reply for Julia — 4 Sep 2026 */
export const JULIA_LINE_REPLY_TH = `ขอบคุณจูเลียค่ะ

ฉลาก: ปรับแล้วตามที่บอสบอก — เหลือ “วันที่รวบรวม” อย่างเดียว ไม่ใส่คำว่านำเข้า จะส่ง PDF ฉบับแก้พร้อมจดหมายวันนี้

รูปจาก Presentation กระบวนการผลิตเมล็ด ขอไฟล์แยก (ความละเอียดสูง) + อนุญาตใช้เป็นลายลักษณ์อักษรรายภาพ + ลายน้ำ Green Future ตามที่คุยไว้ค่ะ

A. ภายนอกสถานที่ + ป้าย GF (สไลด์ 01 หน้า 3)
E. ใบ TH GACP ติดที่สถานที่ ถ้าแยกไฟล์ได้ (สไลด์ 01 หน้า 3)
B. โรงเรือนระยะเจริญเติบโต มุมกว้าง 1 + มุมทำงาน 1 (สไลด์ 06 หน้า 9)
C. พื้นที่ผลิต/แปรรูปเมล็ดในสถานที่ GACP — ห้อง QC/packing มุมกว้าง (สไลด์ 10 หน้า 13)
D. จุดบรรจุ + ตัวอย่างฉลากล็อตบนถุง (สไลด์ 11 หน้า 14)
F. ตู้เก็บ +5°C กับจออุณหภูมิ (สไลด์ 12 หน้า 15)

ยังไม่ขอภาพ hygiene/UV แช่เมล็ด ดอกใกล้ และห้องน้ำปุ๋ยในรอบนี้ค่ะ`;
