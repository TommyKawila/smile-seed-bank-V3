import { ceilThb, DEFAULT_BULK_PRICING } from "@/lib/wholesale-bulk-pricing";

export const DEFAULT_LANDED_PCT = 10;
export const DEFAULT_RETAIL_GM_PCT = 55;
export const DEFAULT_COA_GM_PCT = 20;

/** Target B2B gross margin by Green Future tier code. */
export const B2B_GM_BY_TIER: Record<string, number> = {
  standard_moq: 35,
  ssb_test_order: 35,
  standard_order: 30,
  standard_moq_package: 30,
  order_5000_plus: 25,
  order_10000_plus: 22,
  order_25000_plus: 20,
};

const FALLBACK_B2B_GM = 30;

export function gmForTierCode(code: string): number {
  return B2B_GM_BY_TIER[code] ?? FALLBACK_B2B_GM;
}

export function landedThb(costThb: number, landedPct: number): number {
  if (!Number.isFinite(costThb) || costThb <= 0) return 0;
  const pct = Number.isFinite(landedPct) ? Math.max(0, landedPct) : DEFAULT_LANDED_PCT;
  return costThb * (1 + pct / 100);
}

/** Sell = landed / (1 − GM). GM is a percent 0–99. */
export function sellFromGrossMargin(landed: number, gmPct: number): number {
  if (!Number.isFinite(landed) || landed <= 0) return 0;
  const gm = Math.min(99, Math.max(0, gmPct)) / 100;
  const denom = 1 - gm;
  if (denom <= 0) return 0;
  return ceilThb(landed / denom);
}

export function grossMarginPct(sell: number, landed: number): number {
  if (!Number.isFinite(sell) || sell <= 0) return 0;
  return ((sell - landed) / sell) * 100;
}

export function markupOnCostPct(sell: number, landed: number): number {
  if (!Number.isFinite(landed) || landed <= 0) return 0;
  return ((sell - landed) / landed) * 100;
}

/** Current public wholesale THB/seed for a GF tier, if mapped. */
export function currentWholesaleThbForTier(code: string): number | null {
  const perks = DEFAULT_BULK_PRICING.bulkPerks;
  switch (code) {
    case "standard_moq":
      return DEFAULT_BULK_PRICING.strainTiers[0]?.thbPerSeed ?? 66;
    case "standard_order":
      return DEFAULT_BULK_PRICING.strainTiers[1]?.thbPerSeed ?? 52;
    case "standard_moq_package":
      return perks.find((p) => p.minTotalQty === 2500)?.thbPerSeed ?? 52;
    case "order_5000_plus":
      return perks.find((p) => p.minTotalQty === 5000)?.thbPerSeed ?? 37;
    case "order_10000_plus":
      return perks.find((p) => p.minTotalQty === 10000)?.thbPerSeed ?? 30;
    case "order_25000_plus":
      return perks.find((p) => p.minTotalQty === 25000)?.thbPerSeed ?? 24;
    case "ssb_test_order":
      return DEFAULT_BULK_PRICING.microPackThb;
    default:
      return null;
  }
}

export type ResaleSeedRow = {
  code: string;
  label: string;
  qtyDescription: string | null;
  costThb: number;
  landedThb: number;
  b2bGmPct: number;
  b2bSellThb: number;
  b2bMarkupPct: number;
  retailSellThb: number;
  currentWholesaleThb: number | null;
};

export function buildSeedResaleRow(opts: {
  code: string;
  label: string;
  qtyDescription: string | null;
  costThb: number;
  landedPct: number;
  b2bGmOverride?: number | null;
  retailGmPct: number;
}): ResaleSeedRow {
  const landed = landedThb(opts.costThb, opts.landedPct);
  const b2bGm =
    opts.b2bGmOverride != null && Number.isFinite(opts.b2bGmOverride)
      ? opts.b2bGmOverride
      : gmForTierCode(opts.code);
  const b2bSell = sellFromGrossMargin(landed, b2bGm);
  return {
    code: opts.code,
    label: opts.label,
    qtyDescription: opts.qtyDescription,
    costThb: opts.costThb,
    landedThb: landed,
    b2bGmPct: b2bGm,
    b2bSellThb: b2bSell,
    b2bMarkupPct: markupOnCostPct(b2bSell, landed),
    retailSellThb: sellFromGrossMargin(landed, opts.retailGmPct),
    currentWholesaleThb: currentWholesaleThbForTier(opts.code),
  };
}

export type ResaleCoaRow = {
  code: string;
  label: string;
  costThb: number;
  sellThb: number;
  gmPct: number;
};

export function buildCoaResaleRow(opts: {
  code: string;
  label: string;
  costThb: number;
  gmPct: number;
}): ResaleCoaRow {
  const sell = sellFromGrossMargin(opts.costThb, opts.gmPct);
  return {
    code: opts.code,
    label: opts.label,
    costThb: opts.costThb,
    sellThb: sell,
    gmPct: opts.gmPct,
  };
}
