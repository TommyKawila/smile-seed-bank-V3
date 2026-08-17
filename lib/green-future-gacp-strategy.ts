import { ceilThb, DEFAULT_LANDED_PCT } from "@/lib/wholesale-bulk-pricing";
import { sellFromGrossMargin } from "@/lib/green-future-resale-pricing";

export const RETAIL_PACK_SIZE = 50;
export const DEFAULT_COA_GM_PCT = 20;
export const DEFAULT_DOC_GM_PCT = 20;

/** Flat retail prices (50 seeds) — strategy defaults. */
export const RETAIL_GACP_DOMESTIC_THB = 7990;
export const RETAIL_GACP_EXPORT_LITE_THB = 9490;
export const RETAIL_GACP_EXPORT_STANDARD_THB = 11990;
export const RETAIL_GACP_EXPORT_FULL_THB = 17990;

export type DocParty = "GF" | "SSB" | "GF+DOA" | "GF+SSB";

export type GacpDocumentRow = {
  id: string;
  labelTh: string;
  labelEn: string;
  domestic: boolean | "recommended";
  export: boolean | "recommended" | "optional";
  party: DocParty;
};

export const GACP_DOCUMENT_MATRIX: GacpDocumentRow[] = [
  {
    id: "coa_a",
    labelTh: "COA Purity + Germination (Package A)",
    labelEn: "COA Purity + Germination (Package A)",
    domestic: true,
    export: true,
    party: "GF",
  },
  {
    id: "moisture",
    labelTh: "Moisture Analysis (Package B)",
    labelEn: "Moisture Analysis (Package B)",
    domestic: "recommended",
    export: true,
    party: "GF",
  },
  {
    id: "batch",
    labelTh: "Batch Data (Lot, %งอก, %บริสุทธิ์, วันที่)",
    labelEn: "Batch data (lot, germ %, purity %, dates)",
    domestic: true,
    export: true,
    party: "GF",
  },
  {
    id: "lineage",
    labelTh: "Lineage / Genetic traceability",
    labelEn: "Lineage / genetic traceability",
    domestic: true,
    export: true,
    party: "GF",
  },
  {
    id: "label",
    labelTh: "ฉลากกฎหมาย (Lot, พ.พ.3 + พ.พ.4) บนซองซีล",
    labelEn: "Legal label (lot, PP.3 + PP.4) on sealed pouch",
    domestic: true,
    export: true,
    party: "GF",
  },
  {
    id: "traceability",
    labelTh: "Traceability Pack PDF",
    labelEn: "Traceability Pack PDF",
    domestic: true,
    export: true,
    party: "SSB",
  },
  {
    id: "chain",
    labelTh: "หนังสือรับรองห่วงโซ่ พ.พ.3 → พ.พ.4",
    labelEn: "PP.3 → PP.4 chain letter",
    domestic: true,
    export: true,
    party: "SSB",
  },
  {
    id: "invoice",
    labelTh: "Invoice / Lot reference",
    labelEn: "Invoice / lot reference",
    domestic: true,
    export: true,
    party: "SSB",
  },
  {
    id: "phyto",
    labelTh: "ใบรับรองพืชกักกัน (Phytosanitary)",
    labelEn: "Phytosanitary certificate",
    domestic: false,
    export: true,
    party: "GF+DOA",
  },
  {
    id: "heavy_metal",
    labelTh: "รายงาน Lab โลหะหนัก",
    labelEn: "Heavy metals lab report",
    domestic: false,
    export: true,
    party: "GF",
  },
  {
    id: "pesticide",
    labelTh: "รายงาน Lab สารเคมี / pesticide",
    labelEn: "Pesticide residue lab report",
    domestic: false,
    export: "optional",
    party: "GF",
  },
  {
    id: "mycotoxin",
    labelTh: "รายงาน Mycotoxin",
    labelEn: "Mycotoxin lab report",
    domestic: false,
    export: "optional",
    party: "GF",
  },
  {
    id: "ista",
    labelTh: "ISTA Certificate",
    labelEn: "ISTA certificate",
    domestic: false,
    export: "optional",
    party: "GF",
  },
  {
    id: "en_copy",
    labelTh: "ฉบับภาษาอังกฤษ / certified copy",
    labelEn: "English certified copies",
    domestic: false,
    export: true,
    party: "GF+SSB",
  },
];

export type ExportCostEstimate = {
  code: string;
  labelTh: string;
  labelEn: string;
  costMinThb: number;
  costMaxThb: number;
  costMidThb: number;
  pricedByGf: boolean;
  gfRfq: boolean;
};

/** Mid estimates for GF RFQ — not on current price list except COA B delta. */
export const EXPORT_COST_ESTIMATES: ExportCostEstimate[] = [
  {
    code: "coa_b_delta",
    labelTh: "อัปเกรด COA A → B (Moisture)",
    labelEn: "COA A → B upgrade (moisture)",
    costMinThb: 0,
    costMaxThb: 0,
    costMidThb: 0,
    pricedByGf: true,
    gfRfq: false,
  },
  {
    code: "phytosanitary",
    labelTh: "Phytosanitary (ประสานตรวจ + เอกสาร)",
    labelEn: "Phytosanitary coordination",
    costMinThb: 5000,
    costMaxThb: 15000,
    costMidThb: 10000,
    pricedByGf: false,
    gfRfq: true,
  },
  {
    code: "heavy_metals",
    labelTh: "Heavy metals panel",
    labelEn: "Heavy metals panel",
    costMinThb: 8000,
    costMaxThb: 18000,
    costMidThb: 12000,
    pricedByGf: false,
    gfRfq: true,
  },
  {
    code: "pesticide",
    labelTh: "Pesticide residue panel",
    labelEn: "Pesticide residue panel",
    costMinThb: 10000,
    costMaxThb: 22000,
    costMidThb: 15000,
    pricedByGf: false,
    gfRfq: true,
  },
  {
    code: "mycotoxin",
    labelTh: "Mycotoxin panel",
    labelEn: "Mycotoxin panel",
    costMinThb: 8000,
    costMaxThb: 15000,
    costMidThb: 10000,
    pricedByGf: false,
    gfRfq: true,
  },
  {
    code: "ista",
    labelTh: "ISTA certification",
    labelEn: "ISTA certification",
    costMinThb: 10000,
    costMaxThb: 25000,
    costMidThb: 15000,
    pricedByGf: false,
    gfRfq: true,
  },
  {
    code: "en_copies",
    labelTh: "English certified copies",
    labelEn: "English certified copies",
    costMinThb: 2000,
    costMaxThb: 6000,
    costMidThb: 3500,
    pricedByGf: false,
    gfRfq: true,
  },
];

export type GacpRetailPackage = {
  code: string;
  labelTh: string;
  labelEn: string;
  retailThb: number;
  exportTier: "domestic" | "export_lite" | "export_standard" | "export_full";
  includesTh: string;
  includesEn: string;
};

export const GACP_RETAIL_PACKAGES: GacpRetailPackage[] = [
  {
    code: "domestic_starter",
    labelTh: "GACP Domestic Starter",
    labelEn: "GACP Domestic Starter",
    retailThb: RETAIL_GACP_DOMESTIC_THB,
    exportTier: "domestic",
    includesTh: "50 เมล็ด + COA A + Batch/Lineage + Traceability Pack",
    includesEn: "50 seeds + COA A + batch/lineage + Traceability Pack",
  },
  {
    code: "export_lite",
    labelTh: "GACP Export Lite",
    labelEn: "GACP Export Lite",
    retailThb: RETAIL_GACP_EXPORT_LITE_THB,
    exportTier: "export_lite",
    includesTh: "Domestic + COA B (Moisture)",
    includesEn: "Domestic + COA B (moisture)",
  },
  {
    code: "export_standard",
    labelTh: "GACP Export Standard",
    labelEn: "GACP Export Standard",
    retailThb: RETAIL_GACP_EXPORT_STANDARD_THB,
    exportTier: "export_standard",
    includesTh: "Lite + Phytosanitary + Heavy metals",
    includesEn: "Lite + phytosanitary + heavy metals",
  },
  {
    code: "export_full",
    labelTh: "GACP Export Full",
    labelEn: "GACP Export Full",
    retailThb: RETAIL_GACP_EXPORT_FULL_THB,
    exportTier: "export_full",
    includesTh: "Standard + Pesticide + Mycotoxin + ISTA + EN copies",
    includesEn: "Standard + pesticide + mycotoxin + ISTA + EN copies",
  },
];

export type GfExtraWorkRow = {
  taskTh: string;
  taskEn: string;
  domestic: boolean;
  export: boolean;
};

export const GF_EXTRA_WORK: GfExtraWorkRow[] = [
  {
    taskTh: "บรรจุ 50 เมล็ด/ซอง + ฉลาก Lot / พ.พ.3+4",
    taskEn: "Pack 50 seeds/pouch + lot / PP.3+4 labels",
    domestic: true,
    export: true,
  },
  {
    taskTh: "Lab Package A (Purity + Germination)",
    taskEn: "Lab Package A (purity + germination)",
    domestic: true,
    export: true,
  },
  {
    taskTh: "Lab Package B (Moisture)",
    taskEn: "Lab Package B (moisture)",
    domestic: false,
    export: true,
  },
  {
    taskTh: "Lab panels เพิ่ม (metal / pesticide / mycotoxin)",
    taskEn: "Extra lab panels (metal / pesticide / mycotoxin)",
    domestic: false,
    export: true,
  },
  {
    taskTh: "ประสานตรวจพืชกักกัน + Phytosanitary",
    taskEn: "Phytosanitary inspection coordination",
    domestic: false,
    export: true,
  },
  {
    taskTh: "ISTA testing (ถ้าสั่ง)",
    taskEn: "ISTA testing (if ordered)",
    domestic: false,
    export: true,
  },
  {
    taskTh: "ฉบับอังกฤษ certified copy",
    taskEn: "English certified copies",
    domestic: false,
    export: true,
  },
  {
    taskTh: "Batch Data + Lineage ส่ง SSB",
    taskEn: "Batch data + lineage handoff to SSB",
    domestic: true,
    export: true,
  },
];

export type InvestmentScenario = {
  code: string;
  labelTh: string;
  labelEn: string;
  seeds: number;
  thbPerSeed: number;
  coaCount: number;
  coaFree: number;
  packSize: number;
};

export const INVESTMENT_SCENARIOS: InvestmentScenario[] = [
  {
    code: "moq_500_coa",
    labelTh: "500 เมล็ด · 1 สาย · MOQ + ซื้อ COA",
    labelEn: "500 seeds · 1 strain · MOQ + COA",
    seeds: 500,
    thbPerSeed: 38.44,
    coaCount: 1,
    coaFree: 0,
    packSize: RETAIL_PACK_SIZE,
  },
  {
    code: "moq_500_no_coa",
    labelTh: "500 เมล็ด · 1 สาย · ไม่มี COA",
    labelEn: "500 seeds · 1 strain · no COA",
    seeds: 500,
    thbPerSeed: 38.44,
    coaCount: 0,
    coaFree: 0,
    packSize: RETAIL_PACK_SIZE,
  },
  {
    code: "moq_package_2500",
    labelTh: "2,500 เมล็ด · MOQ Package · COA 1 ฟรี",
    labelEn: "2,500 seeds · MOQ package · 1 free COA",
    seeds: 2500,
    thbPerSeed: 32.68,
    coaCount: 1,
    coaFree: 1,
    packSize: RETAIL_PACK_SIZE,
  },
  {
    code: "tier_10k",
    labelTh: "10,000 เมล็ด · 10k tier · COA 4 ฟรี",
    labelEn: "10,000 seeds · 10k tier · 4 free COAs",
    seeds: 10000,
    thbPerSeed: 21.14,
    coaCount: 4,
    coaFree: 4,
    packSize: RETAIL_PACK_SIZE,
  },
];

export type InvestmentResult = InvestmentScenario & {
  seedCostThb: number;
  landedThb: number;
  coaCostThb: number;
  totalInvestThb: number;
  advance50Thb: number;
  packs: number;
  breakEvenDomestic: number;
  breakEvenExportLite: number;
  profitAllDomestic: number;
  profitAllExportLite: number;
};

export type ExportTierCost = {
  tier: GacpRetailPackage["exportTier"];
  labelTh: string;
  labelEn: string;
  incrementalCostMidThb: number;
  incrementalSellThb: number;
  retailThb: number;
};

export function resolveCoaCosts(coaA: number, coaB: number) {
  const deltaB = Math.max(0, coaB - coaA);
  return { coaA, coaB, deltaB };
}

export function exportIncrementalCostMid(
  tier: GacpRetailPackage["exportTier"],
  coaDeltaB: number
): number {
  const byCode = Object.fromEntries(
    EXPORT_COST_ESTIMATES.map((e) => [e.code, e.costMidThb])
  ) as Record<string, number>;
  byCode.coa_b_delta = coaDeltaB;

  switch (tier) {
    case "domestic":
      return 0;
    case "export_lite":
      return coaDeltaB;
    case "export_standard":
      return coaDeltaB + byCode.phytosanitary + byCode.heavy_metals;
    case "export_full":
      return (
        coaDeltaB +
        byCode.phytosanitary +
        byCode.heavy_metals +
        byCode.pesticide +
        byCode.mycotoxin +
        byCode.ista +
        byCode.en_copies
      );
    default:
      return 0;
  }
}

export function buildExportTierCosts(
  coaA: number,
  coaB: number,
  docGmPct = DEFAULT_DOC_GM_PCT
): ExportTierCost[] {
  const { deltaB } = resolveCoaCosts(coaA, coaB);
  const tiers: Array<{
    tier: GacpRetailPackage["exportTier"];
    labelTh: string;
    labelEn: string;
    retail: number;
  }> = [
    {
      tier: "domestic",
      labelTh: "Domestic Starter",
      labelEn: "Domestic Starter",
      retail: RETAIL_GACP_DOMESTIC_THB,
    },
    {
      tier: "export_lite",
      labelTh: "Export Lite",
      labelEn: "Export Lite",
      retail: RETAIL_GACP_EXPORT_LITE_THB,
    },
    {
      tier: "export_standard",
      labelTh: "Export Standard",
      labelEn: "Export Standard",
      retail: RETAIL_GACP_EXPORT_STANDARD_THB,
    },
    {
      tier: "export_full",
      labelTh: "Export Full",
      labelEn: "Export Full",
      retail: RETAIL_GACP_EXPORT_FULL_THB,
    },
  ];

  return tiers.map(({ tier, labelTh, labelEn, retail }) => {
    const incrementalCostMidThb = exportIncrementalCostMid(tier, deltaB);
    return {
      tier,
      labelTh,
      labelEn,
      incrementalCostMidThb,
      incrementalSellThb: sellFromGrossMargin(incrementalCostMidThb, docGmPct),
      retailThb: retail,
    };
  });
}

export function buildInvestmentResult(
  scenario: InvestmentScenario,
  opts: {
    coaCostPerStrain: number;
    landedPct?: number;
    retailDomestic?: number;
    retailExportLite?: number;
  }
): InvestmentResult {
  const landedPct = opts.landedPct ?? DEFAULT_LANDED_PCT;
  const retailDomestic = opts.retailDomestic ?? RETAIL_GACP_DOMESTIC_THB;
  const retailExportLite = opts.retailExportLite ?? RETAIL_GACP_EXPORT_LITE_THB;

  const seedCostThb = scenario.seeds * scenario.thbPerSeed;
  const landedThb = seedCostThb * (1 + landedPct / 100);
  const paidCoa = Math.max(0, scenario.coaCount - scenario.coaFree);
  const coaCostThb = paidCoa * opts.coaCostPerStrain;
  const totalInvestThb = landedThb + coaCostThb;
  const packs = Math.floor(scenario.seeds / scenario.packSize);

  return {
    ...scenario,
    seedCostThb,
    landedThb,
    coaCostThb,
    totalInvestThb,
    advance50Thb: totalInvestThb * 0.5,
    packs,
    breakEvenDomestic: packs > 0 ? Math.ceil(totalInvestThb / retailDomestic) : 0,
    breakEvenExportLite: packs > 0 ? Math.ceil(totalInvestThb / retailExportLite) : 0,
    profitAllDomestic: packs * retailDomestic - totalInvestThb,
    profitAllExportLite: packs * retailExportLite - totalInvestThb,
  };
}

export function buildAllInvestmentResults(
  coaCostPerStrain: number,
  landedPct = DEFAULT_LANDED_PCT
): InvestmentResult[] {
  return INVESTMENT_SCENARIOS.map((s) =>
    buildInvestmentResult(s, { coaCostPerStrain, landedPct })
  );
}

export const GF_RFQ_QUESTIONS_EN = [
  "Quote per strain/lot (THB + USD) and lead time for COA Package B (moisture) — confirm delta vs Package A.",
  "Phytosanitary certificate: inspection coordination, official certificate, government fees (separate line?).",
  "Additional lab panels: heavy metals, pesticide residue, mycotoxin — sample qty and turnaround each.",
  "ISTA seed testing (Orange/Blue label) if available.",
  "English certified copies of all certificates.",
  "Bundled \"Export Documentation Package\" pricing vs à la carte.",
  "Minimum seeds/strain for export documentation.",
  "Total lead time vs Package A only (~30 days baseline).",
  "Retail pack size: 50 seeds/pouch sealed — confirm GF can pack at source (PP.4 must not repack).",
] as const;

export const GF_PO_CHECKLIST_EN = [
  "Pack size: 50 seeds/pouch, SSB-branded sealed pouches (SSB supplies artwork).",
  "Legal labels: lot no., variety code, germ %, purity %, dates, GF PP.3 + SSB PP.4.",
  "COA Package A/B per strain — list strains (max free COAs per tier).",
  "Certified COA copy (PDF) matched to lot no.",
  "Batch data CSV: variety_code, strain_name, lot_no, germ_%, purity_%, dates, pack_count_50.",
  "Lineage / genetic traceability per COA strain.",
  "Production batch record (harvest → cleaning → packing).",
  "Delivery note + invoice referencing lot & variety code.",
  "Optional export: phytosanitary, extended lab panels, ISTA, EN copies.",
] as const;

export function formatCellFlag(
  value: boolean | "recommended" | "optional"
): { symbol: string; tone: "yes" | "maybe" | "no" } {
  if (value === true) return { symbol: "✓", tone: "yes" };
  if (value === "recommended" || value === "optional")
    return { symbol: "◐", tone: "maybe" };
  return { symbol: "—", tone: "no" };
}
