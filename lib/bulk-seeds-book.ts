import gfList from "@/data/partners/green-future/price-list-gf-ssb-2026-0803.json";
import {
  landedThb,
  markupOnCostPct,
  sellFromGrossMargin,
} from "@/lib/green-future-resale-pricing";
import {
  gmForMinQty,
  recommendedLandedPct,
  type TradeLane,
} from "@/lib/bulk-seeds-trade";

export const SEEDS_GENETICS_SLUG = "seeds-genetics";
export const DEFAULT_EUR_THB = 38.44;

export type BulkSupplierSlug = "green-future" | "seeds-genetics";

export type BulkCostTier = {
  code: string;
  minQty: number;
  label: string;
  qtyDescription: string;
  costEur: number | null;
  costThb: number;
  draft: boolean;
};

/** Public bulk list on seedsgenetics.co (regular customers). */
export type PublicListTier = {
  minQty: number;
  maxQty: number;
  publicEur: number;
  label: string;
};

export type BulkSeedFormat = "photo" | "auto" | "photo-ff";

export type BulkSupplierBook = {
  slug: BulkSupplierSlug;
  name: string;
  origin: string;
  incoterm: string;
  lane: TradeLane;
  currency: "EUR" | "THB";
  notesTh: string;
  notesEn: string;
  recommendedLandedPct: number;
  /** Fixed freight per shipment; allocated per seed by minQty. */
  lotFreightThb: number;
  formats: BulkSeedFormat[];
  strainListPending: boolean;
  tiers: BulkCostTier[];
};

export type BulkPricedTier = BulkCostTier & {
  freightPerSeedThb: number;
  publicEur: number | null;
  publicThb: number | null;
  landedThb: number;
  gmPct: number;
  sellThb: number;
  sellEur: number;
  markupPct: number;
};

export const SEED_FORMAT_LABEL: Record<BulkSeedFormat, string> = {
  photo: "Photo",
  auto: "Auto",
  "photo-ff": "Photo FF",
};

function gfTiers(): BulkCostTier[] {
  return [...gfList.tiers]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({
      code: t.code,
      minQty: minQtyFromCode(t.code, t.qtyDescription),
      label: t.label,
      qtyDescription: t.qtyDescription,
      costEur: Number(t.eurPerSeed),
      costThb: Number(t.thbPerSeed),
      draft: false,
    }));
}

function minQtyFromCode(code: string, desc: string): number {
  if (code.includes("25000")) return 25000;
  if (code.includes("10000")) return 10000;
  if (code.includes("5000")) return 5000;
  if (code === "ssb_test_order") return 200;
  if (code === "standard_moq_package") return 2500;
  if (code === "standard_order") return 1000;
  if (code === "standard_moq") return 500;
  const n = desc.match(/(\d[\d,]*)/);
  if (n?.[1]) return Number(n[1].replace(/,/g, ""));
  return 500;
}

/** Public bulk stairs on seedsgenetics.co — not our cost. */
export const SEEDS_GENETICS_PUBLIC_TIERS: PublicListTier[] = [
  { minQty: 51, maxQty: 100, publicEur: 2.5, label: "51–100 seeds" },
  { minQty: 101, maxQty: 250, publicEur: 2.25, label: "101–250 seeds" },
  { minQty: 251, maxQty: 500, publicEur: 2, label: "251–500 seeds" },
];

export function publicEurAtQty(qty: number): number | null {
  const hit = SEEDS_GENETICS_PUBLIC_TIERS.find((t) => qty >= t.minQty && qty <= t.maxQty);
  if (hit) return hit.publicEur;
  if (qty > 500) return 2;
  return null;
}

/**
 * Direct deal with owner: €1/seed from 250 seeds.
 * Larger qty may go lower later — hold €1 on every SSB stair until a new quote.
 */
const SEEDS_GENETICS_TIERS: BulkCostTier[] = [
  { code: "sg_250", minQty: 250, label: "MOQ", qtyDescription: "250 seeds / strain", costEur: 1, costThb: 0, draft: false },
  { code: "sg_500", minQty: 500, label: "500", qtyDescription: "500 seeds / strain", costEur: 1, costThb: 0, draft: false },
  { code: "sg_1000", minQty: 1000, label: "Standard", qtyDescription: "1,000 seeds / strain", costEur: 1, costThb: 0, draft: false },
  { code: "sg_2500", minQty: 2500, label: "Package", qtyDescription: "2,500 seeds / strain", costEur: 1, costThb: 0, draft: false },
  { code: "sg_5000", minQty: 5000, label: "Volume", qtyDescription: "5,000 seeds / strain", costEur: 1, costThb: 0, draft: false },
  { code: "sg_10000", minQty: 10000, label: "Wholesale", qtyDescription: "10,000 seeds / strain", costEur: 1, costThb: 0, draft: false },
  { code: "sg_25000", minQty: 25000, label: "Contract", qtyDescription: "25,000 seeds / strain", costEur: 1, costThb: 0, draft: false },
];

export const SEEDS_GENETICS_LOT_FREIGHT_THB = 1000;

export const BULK_SUPPLIER_BOOKS: BulkSupplierBook[] = [
  {
    slug: "green-future",
    name: "Green Future",
    origin: "Thailand",
    incoterm: "Ex-works TH",
    lane: "domestic",
    currency: "EUR",
    notesTh: "ต้นทุนจริงจากใบ GF/SSB/2026-0803",
    notesEn: "Live cost from GF/SSB/2026-0803",
    recommendedLandedPct: recommendedLandedPct("domestic", "EXW"),
    lotFreightThb: 0,
    formats: [],
    strainListPending: false,
    tiers: gfTiers(),
  },
  {
    slug: "seeds-genetics",
    name: "Seeds Genetics",
    origin: "Netherlands",
    incoterm: "EUR 1/seed · freight extra",
    lane: "hand_carry",
    currency: "EUR",
    notesTh:
      "ดีลตรงเจ้าของ: €1/เมล็ด จาก 250 เมล็ดขึ้นไป (เว็บสาธารณะ €2.50 / €2.25 / €2.00) · ขั้นใหญ่กว่าอาจถูกกว่าภายหลัง — ตอนนี้อิง €1 ทุกขั้น · ค่าส่ง ~1,000 บาท/ล็อต · หิ้วไม่ผ่านด่าน จึงบวกกันยึด · Photo / Auto / Photo FF · ลิสต์สายพันธุ์รอไฟล์",
    notesEn:
      "Owner deal: €1/seed from 250 (public list €2.50 / €2.25 / €2.00). Larger qty may go lower later — hold €1 for now. Freight ~1,000 THB/lot. Hand-carry seizure buffer. Photo / Auto / Photo FF. Strain list pending.",
    recommendedLandedPct: recommendedLandedPct("hand_carry", ""),
    lotFreightThb: SEEDS_GENETICS_LOT_FREIGHT_THB,
    formats: ["photo", "auto", "photo-ff"],
    strainListPending: true,
    tiers: SEEDS_GENETICS_TIERS,
  },
];

export function getBulkSupplierBook(slug: BulkSupplierSlug): BulkSupplierBook | undefined {
  return BULK_SUPPLIER_BOOKS.find((b) => b.slug === slug);
}

export function priceSupplierBook(opts: {
  book: BulkSupplierBook;
  eurThb: number;
  landedPct: number;
  gmOverride?: number | null;
}): BulkPricedTier[] {
  const fx = opts.eurThb > 0 ? opts.eurThb : DEFAULT_EUR_THB;
  return opts.book.tiers.map((tier) => {
    const costThb =
      tier.costThb > 0 ? tier.costThb : (tier.costEur ?? 0) * fx;
    const freightPerSeedThb =
      opts.book.lotFreightThb > 0 && tier.minQty > 0
        ? opts.book.lotFreightThb / tier.minQty
        : 0;
    const landed = landedThb(costThb + freightPerSeedThb, opts.landedPct);
    const gm =
      opts.gmOverride != null && Number.isFinite(opts.gmOverride)
        ? opts.gmOverride
        : gmForMinQty(tier.minQty);
    const publicEur =
      opts.book.slug === "seeds-genetics" ? publicEurAtQty(tier.minQty) : null;
    const sell = sellFromGrossMargin(landed, gm);
    return {
      ...tier,
      costThb,
      freightPerSeedThb,
      publicEur,
      publicThb: publicEur != null ? publicEur * fx : null,
      landedThb: landed,
      gmPct: gm,
      sellThb: sell,
      sellEur: fx > 0 ? sell / fx : 0,
      markupPct: markupOnCostPct(sell, landed),
    };
  });
}
