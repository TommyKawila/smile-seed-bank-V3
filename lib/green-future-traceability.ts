/** GF × SSB Traceability Pack — public lookup copy & rules (GF/SSB/2026-0821 · 0824) */

export type GfTraceabilityLaunchStatus = "preview" | "live";

/** Flip to live after GF written approval + first lot import validated */
export const GF_TRACEABILITY_LAUNCH_STATUS: GfTraceabilityLaunchStatus =
  "preview";

export function isGfTraceabilityPreview(): boolean {
  return GF_TRACEABILITY_LAUNCH_STATUS === "preview";
}

export const GF_TRACEABILITY_PACK_DISCLAIMER_EN =
  "This traceability documentation pack is intended solely for lot identification and to support traceability within the GACP framework. It is not a separate GACP certificate, DTAM document or approval, and does not guarantee certification or a successful audit.";

export const GF_TRACEABILITY_PACK_DISCLAIMER_TH =
  "ชุดเอกสารตรวจสอบย้อนกลับนี้มีวัตถุประสงค์เพื่อระบุล็อตและสนับสนุนการตรวจสอบย้อนกลับในกรอบ GACP เท่านั้น ไม่ใช่ใบรับรอง GACP แยกต่างหาก เอกสาร DTAM หรือการอนุมัติ และไม่การันตีการรับรองหรือผลการตรวจที่สำเร็จ";

export const GF_TRACEABILITY_PUBLIC_FIELDS = [
  { id: "commercialName", th: "ชื่อการค้า", en: "Commercial Name" },
  { id: "varietyCode", th: "รหัสพันธุ์", en: "Variety Code" },
  { id: "lot", th: "เลขล็อต / แบทช์", en: "Lot / Batch No." },
  { id: "lotStatus", th: "สถานะล็อต", en: "Lot status" },
  { id: "germination", th: "อัตราการงอก", en: "Germination" },
  { id: "purity", th: "ความบริสุทธิ์", en: "Purity" },
  { id: "testDate", th: "วันที่ทดสอบ", en: "Test Date" },
  { id: "testBasis", th: "ฐานการทดสอบ", en: "Test Basis" },
  { id: "producer", th: "ผู้ผลิต", en: "Producer" },
  { id: "authentic", th: "ยืนยันเลขล็อตตรงเอกสาร GF", en: "Lot-authenticity confirmation" },
] as const;

export const GF_TRACEABILITY_RESTRICTED_FIELDS = [
  { th: "PDF Traceability ที่ลงนาม", en: "Signed Traceability PDF" },
  { th: "COA / ISTA", en: "COA / ISTA" },
  { th: "เอกสารต้นทาง / เวอร์ชัน", en: "Source Document / Version" },
  { th: "เอกสาร GF เพิ่มเติม", en: "Additional Green Future documents" },
  { th: "ประวัติการแก้ไข", en: "Change history" },
] as const;

const LOT_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,62}$/;

export function normalizeLotNumber(raw: string): string | null {
  const lot = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!LOT_PATTERN.test(lot)) return null;
  return lot;
}

export type PublicTraceabilityLot = {
  lot: string;
  commercialName: string;
  varietyCode: string;
  lotStatus: string;
  germination: string;
  purity: string;
  testDate: string;
  testBasis: string;
  producer: string;
  authentic: boolean;
};

export type TraceabilityLookup =
  | { kind: "invalid" }
  | { kind: "unpublished"; lot: string }
  | { kind: "unknown"; lot: string }
  | { kind: "found"; record: PublicTraceabilityLot };
