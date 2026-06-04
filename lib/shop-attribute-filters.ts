/** Comma-separated multi-select query params for breeder-context shop filters */

import { parsePackFromUnitLabel } from "@/lib/sku-utils";
import { catalogFloweringBucket } from "@/lib/seed-type-filter";

export function parseListParam(param: string | null | undefined): string[] {
  if (!param?.trim()) return [];
  return param
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const GENETICS_SLUG_TO_DB: Record<string, string> = {
  hybrid: "Hybrid 50/50",
  "sativa-dom": "Mostly Sativa",
  "indica-dom": "Mostly Indica",
};

/** True when every selected slug maps to `products.strain_dominance` (fast SQL filter). */
export function geneticsSlugsFullyDbMappable(slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.every((s) => Boolean(GENETICS_SLUG_TO_DB[s]));
}

export function geneticsDbValuesForSlugs(slugs: string[]): string[] {
  const out: string[] = [];
  for (const s of slugs) {
    const v = GENETICS_SLUG_TO_DB[s];
    if (v) out.push(v);
  }
  return out;
}

const DIFFICULTY_DB_SLUGS = new Set(["easy", "moderate", "hard"]);

export function difficultySlugsFullyDbMappable(slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.every((s) => DIFFICULTY_DB_SLUGS.has(s));
}

const THC_DB_SLUGS = new Set(["high", "mid", "low"]);
const CBD_DB_SLUGS = new Set(["high", "mid", "low"]);
const SEX_DB_SLUGS = new Set(["feminized", "regular"]);

export function cbdSlugsFullyDbMappable(slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.every((s) => CBD_DB_SLUGS.has(s));
}

/** PostgREST `.or()` for CBD buckets on `cbd_percent_num` (high >5, mid 2–5, low <2). */
export function cbdOrFilterExpression(slugs: string[]): string | null {
  const parts: string[] = [];
  if (slugs.includes("high")) parts.push("cbd_percent_num.gt.5");
  if (slugs.includes("mid")) parts.push("and(cbd_percent_num.gte.2,cbd_percent_num.lte.5)");
  if (slugs.includes("low")) parts.push("cbd_percent_num.lt.2");
  if (!parts.length) return null;
  return parts.join(",");
}

export function thcSlugsFullyDbMappable(slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.every((s) => THC_DB_SLUGS.has(s));
}

export function sexSlugsFullyDbMappable(slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.every((s) => SEX_DB_SLUGS.has(s));
}

/** PostgREST `.or()` for THC buckets (high >20, mid 15–20, low <15). */
export function thcOrFilterExpression(slugs: string[]): string | null {
  const parts: string[] = [];
  if (slugs.includes("high")) parts.push("thc_percent.gt.20");
  if (slugs.includes("mid")) parts.push("and(thc_percent.gte.15,thc_percent.lte.20)");
  if (slugs.includes("low")) parts.push("thc_percent.lt.15");
  if (!parts.length) return null;
  return parts.join(",");
}

/** PostgREST `.or()` for `seed_type`. */
export function sexOrFilterExpression(slugs: string[]): string | null {
  const parts: string[] = [];
  if (slugs.includes("feminized")) parts.push("seed_type.eq.FEMINIZED");
  if (slugs.includes("regular")) parts.push("seed_type.eq.REGULAR");
  if (!parts.length) return null;
  return parts.join(",");
}

export type CatalogAttributeFilterParams = {
  genetics: string[];
  difficulty: string[];
  thc: string[];
  cbd: string[];
  sex: string[];
  yieldQuick: string | null;
  seeds: string[];
};

/** `?yield=high` — ILIKE hints on `yield_info` (same spirit as storefront regex). */
export function yieldQuickIsSqlHighFilter(param: string | null | undefined): boolean {
  return param?.trim().toLowerCase() === "high";
}

export function yieldHighOrFilterExpression(): string {
  return [
    "yield_info.ilike.%high%",
    "yield_info.ilike.%xxl%",
    "yield_info.ilike.%heavy%",
    "yield_info.ilike.%massive%",
    "yield_info.ilike.%สูง%",
    "yield_info.ilike.%yield%",
  ].join(",");
}

/** True when sidebar filters must scan rows in memory (packs, ratio genetics, non-high yield). */
export function catalogFiltersRequireMemoryScan(p: CatalogAttributeFilterParams): boolean {
  const yieldNeedsMemory =
    Boolean(p.yieldQuick?.trim()) && !yieldQuickIsSqlHighFilter(p.yieldQuick);
  return (
    (p.genetics.length > 0 && !geneticsSlugsFullyDbMappable(p.genetics)) ||
    (p.difficulty.length > 0 && !difficultySlugsFullyDbMappable(p.difficulty)) ||
    (p.thc.length > 0 && !thcSlugsFullyDbMappable(p.thc)) ||
    (p.cbd.length > 0 && !cbdSlugsFullyDbMappable(p.cbd)) ||
    (p.sex.length > 0 && !sexSlugsFullyDbMappable(p.sex)) ||
    yieldNeedsMemory ||
    (p.seeds.length > 0 && !seedsSlugsFullyDbMappable(p.seeds))
  );
}

/** Default `id DESC` catalog — cursor pagination (no offset rescan). */
export function catalogSupportsIdCursorPagination(opts: {
  needsSidebarFilterScan: boolean;
  memoryFtPassNeeded: boolean;
  saleOnly: boolean;
  clearanceOnly: boolean;
  useEnrichedCatalog: boolean;
  sortKey: string | undefined;
}): boolean {
  if (
    opts.needsSidebarFilterScan ||
    opts.memoryFtPassNeeded ||
    opts.saleOnly ||
    opts.clearanceOnly ||
    opts.useEnrichedCatalog
  ) {
    return false;
  }
  const sk = opts.sortKey;
  if (
    sk === "price_asc" ||
    sk === "price_desc" ||
    sk === "smart_deal" ||
    sk === "new_arrivals" ||
    sk === "newest"
  ) {
    return false;
  }
  return true;
}

/** Sidebar attribute filters are applied on the server (SQL) — client can skip re-filter. */
export function catalogAttributeFiltersHandledOnServer(p: CatalogAttributeFilterParams): boolean {
  const hasAttribute =
    p.genetics.length > 0 ||
    p.difficulty.length > 0 ||
    p.thc.length > 0 ||
    p.cbd.length > 0 ||
    p.sex.length > 0 ||
    Boolean(p.yieldQuick?.trim()) ||
    p.seeds.length > 0;
  return hasAttribute && !catalogFiltersRequireMemoryScan(p);
}

/** PostgREST `.or()` expression for `growing_difficulty`. */
export function difficultyOrFilterExpression(slugs: string[]): string | null {
  const parts: string[] = [];
  if (slugs.includes("easy")) parts.push("growing_difficulty.eq.easy");
  if (slugs.includes("moderate")) parts.push("growing_difficulty.eq.moderate");
  if (slugs.includes("hard")) parts.push("growing_difficulty.in.(difficult,hard)");
  if (!parts.length) return null;
  return parts.join(",");
}

export type GeneticsFilterProduct = {
  strain_dominance?: string | null;
  sativa_ratio?: number | null;
  indica_ratio?: number | null;
  genetic_ratio?: string | null;
  genetics?: string | null;
};

/** Classify product into genetics URL slug (sidebar / quick nav). */
export function classifyGeneticsSlugFromProduct(
  p: GeneticsFilterProduct
): keyof typeof GENETICS_SLUG_TO_DB | null {
  const dom = (p.strain_dominance ?? "").trim();
  if (dom === "Hybrid 50/50") return "hybrid";
  if (dom === "Mostly Sativa") return "sativa-dom";
  if (dom === "Mostly Indica") return "indica-dom";

  const sat = Number(p.sativa_ratio);
  const ind = Number(p.indica_ratio);
  if (Number.isFinite(sat) && Number.isFinite(ind)) {
    if (sat >= 60 && sat > ind) return "sativa-dom";
    if (ind >= 60 && ind > sat) return "indica-dom";
    if (Math.abs(sat - ind) <= 15) return "hybrid";
  }

  const text = `${p.genetic_ratio ?? ""} ${p.genetics ?? ""}`.toLowerCase();
  if (!text.trim()) return null;
  if (text.includes("hybrid") || text.includes("50/50") || text.includes("balanced")) return "hybrid";
  if (text.includes("sativa") && !text.includes("indica")) return "sativa-dom";
  if (text.includes("indica") && !text.includes("sativa")) return "indica-dom";
  return null;
}

export function productMatchesGeneticsFilter(
  product: GeneticsFilterProduct | string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const fields: GeneticsFilterProduct =
    typeof product === "string" || product == null
      ? { strain_dominance: product ?? null }
      : product;
  const bucket = classifyGeneticsSlugFromProduct(fields);
  if (bucket && selectedSlugs.includes(bucket)) return true;
  const dom = (fields.strain_dominance ?? "").trim();
  for (const slug of selectedSlugs) {
    const want = GENETICS_SLUG_TO_DB[slug];
    if (want && dom === want) return true;
  }
  return false;
}

export function productMatchesDifficultyFilter(
  growingDifficulty: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const raw = (growingDifficulty ?? "").trim().toLowerCase();
  for (const s of selectedSlugs) {
    if (s === "easy" && raw === "easy") return true;
    if (s === "moderate" && raw === "moderate") return true;
    if (s === "hard" && (raw === "difficult" || raw === "hard")) return true;
  }
  return false;
}

export function productMatchesThcFilter(
  thcPercent: number | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  if (thcPercent == null || Number.isNaN(Number(thcPercent))) return false;
  const n = Number(thcPercent);
  for (const s of selectedSlugs) {
    if (s === "high" && n > 20) return true;
    if (s === "mid" && n >= 15 && n <= 20) return true;
    if (s === "low" && n < 15) return true;
  }
  return false;
}

export function parseCbdNumeric(cbd: string | null | undefined): number | null {
  if (cbd == null || cbd === "") return null;
  const m = String(cbd).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** CBD buckets: High >5%, Mid 2–5%, Low <2% (numeric parse from free-form cbd_percent). */
export function productMatchesCbdFilter(
  cbdPercent: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const n = parseCbdNumeric(cbdPercent);
  if (n == null) return false;
  for (const s of selectedSlugs) {
    if (s === "high" && n > 5) return true;
    if (s === "mid" && n >= 2 && n <= 5) return true;
    if (s === "low" && n < 2) return true;
  }
  return false;
}

export function productMatchesSexFilter(
  seedType: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const u = (seedType ?? "").toUpperCase();
  for (const s of selectedSlugs) {
    if (s === "feminized" && u === "FEMINIZED") return true;
    if (s === "regular" && u === "REGULAR") return true;
  }
  return false;
}

/** Quick nav / URL `yield=high` — matches free-text yield_info (EN/TH hints). */
export function productMatchesYieldQuickParam(
  yieldInfo: string | null | undefined,
  param: string | null | undefined
): boolean {
  const want = param?.trim().toLowerCase();
  if (!want) return true;
  if (want !== "high") return true;
  const s = (yieldInfo ?? "").toLowerCase();
  return /high|xl|xxl|heavy|massive|monster|abundant|bumper|ผล|สูง|มาก|เยอะ|ใหญ่|yield/.test(s);
}

/** URL slugs for pack filters; `other` = counts in 1–10 that are not 1,2,3,5,10; `gt10` = >10. */
export const SEED_PACK_FILTER_SLUGS = [
  "1",
  "2",
  "3",
  "5",
  "10",
  "gt10",
  "other",
] as const;
export type SeedPackFilterSlug = (typeof SEED_PACK_FILTER_SLUGS)[number];

const EXPLICIT_SINGLE_DIGIT_PACKS = new Set([1, 2, 3, 5, 10]);

/** Packs like 4, 6, 7, 8, 9 (anything 1–10 except the explicit size filters). */
export function seedPackMatchesOtherBucket(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 10 && !EXPLICIT_SINGLE_DIGIT_PACKS.has(n);
}

/** Bucket slugs stored on `products.pack_buckets` (same rules as pack filter). */
export function packBucketsFromVariants(
  variants:
    | { unit_label: string; is_active?: boolean | null }[]
    | null
    | undefined
): string[] {
  const buckets = new Set<string>();
  for (const v of (variants ?? []).filter((x) => x.is_active !== false)) {
    const n = parsePackFromUnitLabel(v.unit_label);
    if (n === 1) buckets.add("1");
    else if (n === 2) buckets.add("2");
    else if (n === 3) buckets.add("3");
    else if (n === 5) buckets.add("5");
    else if (n === 10) buckets.add("10");
    else if (n > 10) buckets.add("gt10");
    else if (seedPackMatchesOtherBucket(n)) buckets.add("other");
  }
  return [...buckets];
}

export function seedsSlugsFullyDbMappable(slugs: string[]): boolean {
  if (slugs.length === 0) return false;
  return slugs.every((s) => (SEED_PACK_FILTER_SLUGS as readonly string[]).includes(s));
}

export function productMatchesSeedsPackFilter(
  variants:
    | { unit_label: string; is_active?: boolean | null }[]
    | null
    | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const active = (variants ?? []).filter((v) => v.is_active !== false);
  for (const v of active) {
    const n = parsePackFromUnitLabel(v.unit_label);
    for (const s of selectedSlugs) {
      if (s === "1" && n === 1) return true;
      if (s === "2" && n === 2) return true;
      if (s === "3" && n === 3) return true;
      if (s === "5" && n === 5) return true;
      if (s === "10" && n === 10) return true;
      if (s === "gt10" && n > 10) return true;
      if (s === "other" && seedPackMatchesOtherBucket(n)) return true;
    }
  }
  return false;
}

/** True when every selected pack slug exists on `products.pack_buckets`. */
export function productMatchesPackBucketsColumn(
  packBuckets: string[] | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const have = new Set(packBuckets ?? []);
  return selectedSlugs.some((s) => have.has(s));
}

/**
 * Catalog / card: one variant to display when URL `seeds=` slugs are active.
 * Same bucket rules as {@link productMatchesSeedsPackFilter}; prefers in-stock,
 * then lowest list price, then smallest pack.
 */
export function pickVariantForSeedPackSlugs<
  T extends {
    unit_label: string;
    price?: number | null;
    stock?: number | null;
    is_active?: boolean | null;
  },
>(variants: T[] | null | undefined, selectedSlugs: string[]): T | null {
  if (!selectedSlugs.length) return null;
  const active = (variants ?? []).filter((v) => v.is_active !== false);
  const matched = active.filter((v) => productMatchesSeedsPackFilter([v], selectedSlugs));
  if (matched.length === 0) return null;
  type Row = { v: T; price: number; stock: number; pack: number };
  const rows: Row[] = matched.map((v) => ({
    v,
    price: Number(v.price ?? 0),
    stock: Number(v.stock ?? 0),
    pack: parsePackFromUnitLabel(v.unit_label),
  }));
  const priced = rows.filter((r) => r.price > 0);
  if (priced.length === 0) return null;
  const inStock = priced.filter((r) => r.stock > 0);
  const pool = inStock.length > 0 ? inStock : priced;
  const minPrice = Math.min(...pool.map((r) => r.price));
  const tied = pool.filter((r) => r.price === minPrice);
  tied.sort((a, b) => a.pack - b.pack);
  return tied[0]?.v ?? null;
}

function seedPackBucketsForVariants(
  variants: { unit_label: string; is_active?: boolean | null }[] | null | undefined
): Set<string> {
  const out = new Set<string>();
  const active = (variants ?? []).filter((v) => v.is_active !== false);
  for (const v of active) {
    const n = parsePackFromUnitLabel(v.unit_label);
    if (n === 1) out.add("1");
    if (n === 2) out.add("2");
    if (n === 3) out.add("3");
    if (n === 5) out.add("5");
    if (n === 10) out.add("10");
    if (n > 10) out.add("gt10");
    if (seedPackMatchesOtherBucket(n)) out.add("other");
  }
  return out;
}

export function productMatchesShopAttributeFilters(
  p: {
    strain_dominance?: string | null;
    sativa_ratio?: number | null;
    indica_ratio?: number | null;
    genetic_ratio?: string | null;
    genetics?: string | null;
    growing_difficulty?: string | null;
    thc_percent?: number | null;
    cbd_percent?: string | null;
    seed_type?: string | null;
    yield_info?: string | null;
    product_variants?: { unit_label: string; is_active?: boolean | null }[] | null;
  },
  genetics: string[],
  difficulty: string[],
  thc: string[],
  cbd: string[],
  sex: string[],
  yieldQuick?: string | null,
  seeds?: string[]
): boolean {
  return (
    productMatchesGeneticsFilter(p, genetics) &&
    productMatchesDifficultyFilter(p.growing_difficulty, difficulty) &&
    productMatchesThcFilter(p.thc_percent, thc) &&
    productMatchesCbdFilter(p.cbd_percent, cbd) &&
    productMatchesSexFilter(p.seed_type, sex) &&
    productMatchesYieldQuickParam(p.yield_info, yieldQuick) &&
    productMatchesSeedsPackFilter(p.product_variants ?? null, seeds ?? [])
  );
}

export type ShopFilterCountProduct = {
  strain_dominance?: string | null;
  sativa_ratio?: number | null;
  indica_ratio?: number | null;
  genetic_ratio?: string | null;
  genetics?: string | null;
  growing_difficulty?: string | null;
  thc_percent?: number | null;
  cbd_percent?: string | null;
  seed_type?: string | null;
  flowering_type?: string | null;
  category?: string | null;
  product_categories?: { name?: string | null } | null;
  product_variants?: { unit_label: string; is_active?: boolean | null }[] | null;
};

export type CatalogFloweringPillSlug = "auto" | "photo" | "photo-ff" | "photo-3n";

export type ShopFilterOptionCounts = {
  genetics: Record<string, number>;
  thc: Record<string, number>;
  cbd: Record<string, number>;
  difficulty: Record<string, number>;
  sex: Record<string, number>;
  seeds: Record<string, number>;
  flowering: Record<CatalogFloweringPillSlug, number>;
};

export function defaultFilterOptionCounts(): ShopFilterOptionCounts {
  return {
    genetics: { hybrid: 0, "sativa-dom": 0, "indica-dom": 0 },
    thc: { high: 0, mid: 0, low: 0 },
    cbd: { high: 0, mid: 0, low: 0 },
    difficulty: { easy: 0, moderate: 0, hard: 0 },
    sex: { feminized: 0, regular: 0 },
    seeds: { "1": 0, "2": 0, "3": 0, "5": 0, "10": 0, gt10: 0, other: 0 },
    flowering: { auto: 0, photo: 0, "photo-ff": 0, "photo-3n": 0 },
  };
}

function classifyFloweringPillSlug(
  p: ShopFilterCountProduct
): CatalogFloweringPillSlug | null {
  const b = catalogFloweringBucket({
    flowering_type: p.flowering_type,
    category: p.category,
    product_categories: p.product_categories,
  });
  if (b === "auto") return "auto";
  if (b === "photo") return "photo";
  if (b === "photo_ff") return "photo-ff";
  if (b === "photo_3n") return "photo-3n";
  return null;
}

function classifyGeneticsSlug(
  product: GeneticsFilterProduct | string | null | undefined
): string | null {
  const fields: GeneticsFilterProduct =
    typeof product === "string" || product == null
      ? { strain_dominance: product ?? null }
      : product;
  return classifyGeneticsSlugFromProduct(fields);
}

function classifyThcSlug(thcPercent: number | null | undefined): string | null {
  if (thcPercent == null || Number.isNaN(Number(thcPercent))) return null;
  const n = Number(thcPercent);
  if (n > 20) return "high";
  if (n >= 15 && n <= 20) return "mid";
  if (n < 15) return "low";
  return null;
}

function classifyCbdSlug(cbdPercent: string | null | undefined): string | null {
  const n = parseCbdNumeric(cbdPercent);
  if (n == null) return null;
  if (n > 5) return "high";
  if (n >= 2 && n <= 5) return "mid";
  if (n < 2) return "low";
  return null;
}

function classifyDifficultySlug(growingDifficulty: string | null | undefined): string | null {
  const raw = (growingDifficulty ?? "").trim().toLowerCase();
  if (raw === "easy") return "easy";
  if (raw === "moderate") return "moderate";
  if (raw === "difficult" || raw === "hard") return "hard";
  return null;
}

function classifySexSlug(seedType: string | null | undefined): string | null {
  const u = (seedType ?? "").toUpperCase();
  if (u === "FEMINIZED") return "feminized";
  if (u === "REGULAR") return "regular";
  return null;
}

/** Counts products per filter bucket (same thresholds as productMatches*). Scope = breeder/search/ft only (exclude sidebar URL filters). */
export function calculateFilterCounts(products: ShopFilterCountProduct[]): ShopFilterOptionCounts {
  const c = defaultFilterOptionCounts();
  for (const p of products) {
    const g = classifyGeneticsSlug(p);
    if (g && g in c.genetics) c.genetics[g] += 1;

    const th = classifyThcSlug(p.thc_percent);
    if (th && th in c.thc) c.thc[th] += 1;

    const cb = classifyCbdSlug(p.cbd_percent ?? null);
    if (cb && cb in c.cbd) c.cbd[cb] += 1;

    const d = classifyDifficultySlug(p.growing_difficulty);
    if (d && d in c.difficulty) c.difficulty[d] += 1;

    const s = classifySexSlug(p.seed_type ?? null);
    if (s && s in c.sex) c.sex[s] += 1;

    for (const bucket of seedPackBucketsForVariants(p.product_variants ?? null)) {
      if (bucket in c.seeds) c.seeds[bucket] += 1;
    }

    const ft = classifyFloweringPillSlug(p);
    if (ft) c.flowering[ft] += 1;
  }
  return c;
}

/** @deprecated Use productMatchesShopAttributeFilters */
export function productMatchesBreederAttributeFilters(
  p: {
    strain_dominance?: string | null;
    growing_difficulty?: string | null;
    thc_percent?: number | null;
  },
  genetics: string[],
  difficulty: string[],
  thc: string[]
): boolean {
  return productMatchesShopAttributeFilters(
    { ...p, cbd_percent: null, seed_type: null, yield_info: null, product_variants: null },
    genetics,
    difficulty,
    thc,
    [],
    [],
    null,
    []
  );
}
