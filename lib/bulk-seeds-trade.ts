/**
 * Landed-cost adders for bulk seed resale — ICC Incoterms 2020 + standard import costing.
 * Admin strategy only. Do not show this stack on customer share links.
 */

export type TradeLane = "domestic" | "import_eu" | "hand_carry";

export type LandedAdder = {
  code: string;
  labelTh: string;
  labelEn: string;
  whyTh: string;
  whyEn: string;
  recommendedPct: number;
  skipIfIncoterm?: "CIF" | "DDP";
};

/** Thailand-origin supplier (Green Future): invoice already in local chain. */
export const DOMESTIC_ADDERS: LandedAdder[] = [
  {
    code: "vat_handling",
    labelTh: "VAT / จัดการในประเทศ",
    labelEn: "VAT & local handling",
    whyTh: "ภาษีมูลค่าเพิ่ม 7% และค่าจัดการคลัง — อย่าคิดว่าต้นทุนใบแจ้งหนี้คือต้นทุนขายได้ทันที",
    whyEn: "TH VAT 7% plus warehouse handling. Invoice cost is not yet sellable cost.",
    recommendedPct: 5,
  },
  {
    code: "working_capital",
    labelTh: "เงินทุนหมุนเวียน (มัดจำ 50%)",
    labelEn: "Working capital (50% advance)",
    whyTh: "ผู้ผลิตขอมัดจำก่อนผลิต/แล็บ — เงินถูกผูกจนกว่าของถึง ควรคิดต้นทุนเงิน",
    whyEn: "Supplier 50% advance ties cash until delivery; include cost of capital.",
    recommendedPct: 2,
  },
  {
    code: "germ_buffer",
    labelTh: "กันความเสี่ยงงอก / ISTA",
    labelEn: "Germination / ISTA buffer",
    whyTh: "ล็อตที่ไม่ผ่านหรืองอกต่ำกว่าสเปก ต้องสำรอง % ไม่เช่นนั้นกินกำไร",
    whyEn: "Failed lots or below-spec germination eat margin unless buffered.",
    recommendedPct: 3,
  },
];

/**
 * Seeds Genetics NL — seed price excludes lot freight; goods are hand-carried, not customs-cleared.
 * Freight is a fixed THB/lot (not this %). Seizure contingency prices total-loss risk on remaining lots.
 */
export const HAND_CARRY_ADDERS: LandedAdder[] = [
  {
    code: "fx_bank",
    labelTh: "ส่วนต่าง FX + ค่าโอน",
    labelEn: "FX spread & transfer",
    whyTh: "ใบราคา EUR ขาย THB — ใช้เรทธนาคาร อย่าใช้เรทกลางตลาด",
    whyEn: "EUR invoice, THB sell: use bank spread, not mid-market FX.",
    recommendedPct: 2,
  },
  {
    code: "seizure_contingency",
    labelTh: "กันความเสี่ยงยึดสินค้า (หิ้วไม่ผ่านด่าน)",
    labelEn: "Seizure / total-loss contingency",
    whyTh: "เมล็ดหิ้วไม่ผ่านศุลกากร — ถ้าโดนยึดเสียทั้งล็อต (เมล็ด+ค่าส่ง) ต้องบวกเผื่อจากล็อตที่ถึง",
    whyEn: "Hand-carry, not customs-cleared: a seized lot is 100% loss of seed + freight. Buffer surviving lots.",
    recommendedPct: 15,
  },
  {
    code: "germ_buffer",
    labelTh: "กันความเสี่ยงงอก",
    labelEn: "Germination buffer",
    whyTh: "ล็อตงอกต่ำกว่าสเปกกินกำไร ถ้าไม่มีกัน",
    whyEn: "Below-spec germination eats margin unless buffered.",
    recommendedPct: 3,
  },
  {
    code: "local_handling",
    labelTh: "จัดการคลังในประเทศ",
    labelEn: "Local warehouse handling",
    whyTh: "รับของเข้าคลัง SSB หลังถึงไทย",
    whyEn: "Intake into SSB warehouse after arrival.",
    recommendedPct: 1.5,
  },
];

/** Formal EU → TH import (kept if a later quote is customs-cleared CIF/FOB). */
export const IMPORT_EU_ADDERS: LandedAdder[] = [
  {
    code: "freight_ins",
    labelTh: "ค่าระวาง + ประกัน",
    labelEn: "Freight & insurance",
    whyTh: "Incoterms 2020: ถ้าใบราคาเป็น EXW/FOB ผู้ซื้อรับค่าระวางเอง อย่านับซ้ำถ้าเป็น CIF",
    whyEn: "Incoterms 2020: EXW/FOB leaves freight to buyer. Skip if the quote is already CIF.",
    recommendedPct: 5,
    skipIfIncoterm: "CIF",
  },
  {
    code: "duty_broker",
    labelTh: "อากร + นายหน้าศุลกากร",
    labelEn: "Duty & customs broker",
    whyTh: "เมล็ดสำหรับเพาะ (HS 1209) อากรไทยมักต่ำ แต่ค่าพิธีการมีเสมอ",
    whyEn: "Sowing seed (HS 1209) often low duty in TH; brokerage is still real cash.",
    recommendedPct: 3,
  },
  {
    code: "phyto_permit",
    labelTh: "ใบรับรองสุขอนามัยพืช / ใบอนุญาตนำเข้า",
    labelEn: "Phytosanitary & import permit",
    whyTh: "Phyto + ISTA + ใบอนุญาตนำเข้าเป็นต้นทุนต่อล็อต ไม่ได้อยู่ในราคาต่อเมล็ดของผู้ผลิต",
    whyEn: "Phyto, ISTA, and import permits are lot costs — not in the grower’s seed price.",
    recommendedPct: 2,
  },
  {
    code: "fx_bank",
    labelTh: "ส่วนต่าง FX + ค่าโอน SWIFT",
    labelEn: "FX spread & SWIFT",
    whyTh: "ใบราคา EUR ขาย THB — ใช้เรทเผื่อสเปรดธนาคาร อย่าใช้เรทกลางตลาด",
    whyEn: "EUR invoice, THB sell: use bank spread, not mid-market FX.",
    recommendedPct: 2,
  },
  {
    code: "working_capital",
    labelTh: "เงินทุนหมุนเวียน (มัดจำ)",
    labelEn: "Working capital (advance)",
    whyTh: "โอนมัดจำข้ามประเทศก่อนของออกเรือ กดสภาพคล่อง",
    whyEn: "Cross-border advance before shipment ties cash.",
    recommendedPct: 2,
  },
  {
    code: "germ_buffer",
    labelTh: "กันความเสี่ยงงอก / ดีเลย์ด่าน",
    labelEn: "Germination & border delay",
    whyTh: "ของถูกกักที่ด่านหรืองอกไม่ตามสเปก — กัน 3–5% ไม่งั้นเข้าเนื้อ",
    whyEn: "Hold at border or off-spec germination: 3–5% buffer or you sell below true cost.",
    recommendedPct: 4,
  },
  {
    code: "inland",
    labelTh: "ขนส่งในประเทศหลังผ่านด่าน",
    labelEn: "Inland haul after clearance",
    whyTh: "จากท่าเรือ/สนามบินถึงคลัง SSB",
    whyEn: "Port/airport to SSB warehouse.",
    recommendedPct: 1.5,
  },
];

export const ADDERS_BY_LANE: Record<TradeLane, LandedAdder[]> = {
  domestic: DOMESTIC_ADDERS,
  import_eu: IMPORT_EU_ADDERS,
  hand_carry: HAND_CARRY_ADDERS,
};

export function recommendedLandedPct(lane: TradeLane, incoterm: string): number {
  const term = incoterm.trim().toUpperCase();
  const rows = ADDERS_BY_LANE[lane];
  return rows.reduce((sum, row) => {
    if (row.skipIfIncoterm && term.includes(row.skipIfIncoterm)) return sum;
    return sum + row.recommendedPct;
  }, 0);
}

/** Volume GM: keep margin at high qty — pass some, not all, of supplier discount. */
export const GM_BY_QTY: { minQty: number; gmPct: number; labelTh: string; labelEn: string }[] = [
  { minQty: 250, gmPct: 35, labelTh: "MOQ (ดีลตรง)", labelEn: "MOQ (direct deal)" },
  { minQty: 500, gmPct: 35, labelTh: "MOQ+", labelEn: "MOQ+" },
  { minQty: 1000, gmPct: 30, labelTh: "ออเดอร์มาตรฐาน", labelEn: "Standard order" },
  { minQty: 2500, gmPct: 30, labelTh: "แพ็กเกจ", labelEn: "Package" },
  { minQty: 5000, gmPct: 25, labelTh: "วอลุ่ม", labelEn: "Volume" },
  { minQty: 10000, gmPct: 22, labelTh: "ขายส่ง", labelEn: "Wholesale" },
  { minQty: 25000, gmPct: 20, labelTh: "สัญญา", labelEn: "Contract" },
];

export function gmForMinQty(minQty: number): number {
  let gm = GM_BY_QTY[0]?.gmPct ?? 30;
  for (const row of GM_BY_QTY) {
    if (minQty >= row.minQty) gm = row.gmPct;
  }
  return gm;
}
