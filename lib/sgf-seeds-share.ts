import {
  grossMarginPct,
  landedThb,
  markupOnCostPct,
  sellFromGrossMargin,
} from "@/lib/green-future-resale-pricing";
import {
  DEFAULT_EUR_THB,
  type BulkCostTier,
  type BulkPricedTier,
  type BulkSupplierBook,
} from "@/lib/bulk-seeds-book";
import { gmForMinQty } from "@/lib/bulk-seeds-trade";
import type { PartnerStrainRecord } from "@/types/partner-catalog";

export const SGF_SEEDS_SHARE_NAME = "SGF Seeds";
export const SGF_SEEDS_SHARE_TAGLINE =
  "Green Future documented seed programme — distributed by Smile Seed Bank";

/** Customer-facing tier labels — aligned with Seeds Genetics share layout. */
export const SGF_SHARE_TIER_STEPS: Pick<BulkCostTier, "minQty" | "label" | "qtyDescription">[] = [
  { minQty: 50, label: "Starter", qtyDescription: "50–249 seeds / strain" },
  { minQty: 250, label: "MOQ", qtyDescription: "250 seeds / strain" },
  { minQty: 500, label: "500", qtyDescription: "500 seeds / strain" },
  { minQty: 1000, label: "Standard", qtyDescription: "1,000 seeds / strain" },
  { minQty: 2500, label: "Package", qtyDescription: "2,500 seeds / strain" },
  { minQty: 5000, label: "Volume", qtyDescription: "5,000 seeds / strain" },
  { minQty: 10000, label: "Wholesale", qtyDescription: "10,000 seeds / strain" },
  { minQty: 25000, label: "Contract", qtyDescription: "25,000 seeds / strain" },
];

export type SgfStrainBucket = "autoflower" | "photo" | "photo-ff";

export const SGF_STRAIN_BUCKET_ORDER: SgfStrainBucket[] = ["autoflower", "photo", "photo-ff"];

export const SGF_STRAIN_BUCKET_LABEL: Record<SgfStrainBucket, string> = {
  autoflower: "Autoflower",
  photo: "Photo",
  "photo-ff": "Photo FF",
};

const GF_SKIP_COST_CODES = new Set(["ssb_test_order"]);
const SGF_STARTER_FALLBACK_EUR = 1.15;

function gfStarterCostTier(tiers: BulkCostTier[]): BulkCostTier {
  const hit = tiers.find((t) => t.code === "ssb_test_order");
  if (hit) return hit;
  return {
    code: "sgf_starter_fallback",
    minQty: 50,
    label: "Starter",
    qtyDescription: "50–249 seeds / strain",
    costEur: SGF_STARTER_FALLBACK_EUR,
    costThb: 0,
    draft: false,
  };
}

function gfCommercialTiers(tiers: BulkCostTier[]): BulkCostTier[] {
  return tiers
    .filter((t) => !GF_SKIP_COST_CODES.has(t.code))
    .sort((a, b) => a.minQty - b.minQty);
}

/** Starter 50–249 uses test-order cost; MOQ 250+ maps to commercial GF stairs. */
export function gfCostTierForShareQty(tiers: BulkCostTier[], shareQty: number): BulkCostTier {
  if (shareQty < 250) return gfStarterCostTier(tiers);
  const commercial = gfCommercialTiers(tiers);
  const effectiveQty = Math.max(shareQty, commercial[0]?.minQty ?? 500);
  let picked = commercial[0]!;
  for (const t of commercial) {
    if (effectiveQty >= t.minQty) picked = t;
  }
  return picked;
}

export function priceSgfShareTiers(opts: {
  book: BulkSupplierBook;
  eurThb: number;
  landedPct: number;
  gmOverride?: number | null;
}): BulkPricedTier[] {
  const fx = opts.eurThb > 0 ? opts.eurThb : DEFAULT_EUR_THB;
  return SGF_SHARE_TIER_STEPS.map((step) => {
    const costTier = gfCostTierForShareQty(opts.book.tiers, step.minQty);
    const costThb =
      costTier.costThb > 0 ? costTier.costThb : (costTier.costEur ?? 0) * fx;
    const landed = landedThb(costThb, opts.landedPct);
    const gm =
      opts.gmOverride != null && Number.isFinite(opts.gmOverride)
        ? opts.gmOverride
        : gmForMinQty(step.minQty);
    const sell = sellFromGrossMargin(landed, gm);
    const sellEur = fx > 0 ? sell / fx : 0;
    return {
      code: `sgf_share_${step.minQty}`,
      minQty: step.minQty,
      label: step.label,
      qtyDescription: step.qtyDescription,
      costEur: costTier.costEur,
      costThb,
      draft: false,
      freightPerSeedThb: 0,
      publicEur: null,
      publicThb: null,
      landedThb: landed,
      gmPct: grossMarginPct(sell, landed),
      sellThb: sell,
      sellEur,
      markupPct: markupOnCostPct(sell, landed),
    };
  });
}

export function sgfStrainBucket(strain: PartnerStrainRecord): SgfStrainBucket {
  const code = strain.varietyCode.trim().toUpperCase();
  if (code.startsWith("AF")) return "autoflower";
  if (code.startsWith("FF")) return "photo-ff";
  const typeHay = `${strain.typeLabel ?? ""} ${strain.strainName}`.toLowerCase();
  if (typeHay.includes("fast flowering") || typeHay.includes("fast-flowering")) {
    return "photo-ff";
  }
  return "photo";
}

export function sgfStrainsGrouped(strains: PartnerStrainRecord[]) {
  return SGF_STRAIN_BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: SGF_STRAIN_BUCKET_LABEL[bucket],
    strains: strains.filter((s) => sgfStrainBucket(s) === bucket),
  })).filter((g) => g.strains.length > 0);
}
