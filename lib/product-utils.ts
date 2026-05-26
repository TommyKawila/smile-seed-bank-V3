/**
 * Product name helpers for catalog / import (display & SEO).
 */

import type { ProductVariant } from "@/types/supabase";
import { getMessage } from "@/lib/i18n-messages";
import { parsePackFromUnitLabel } from "@/lib/sku-utils";

/** Deterministic fallback when name has no Latin letters (e.g. Thai-only). */
function slugFallbackFromName(name: string): string {
  const enc = new TextEncoder().encode(name.trim() || "x");
  let h = 2166136261;
  for (let i = 0; i < enc.length; i++) {
    h ^= enc[i]!;
    h = Math.imul(h, 16777619);
  }
  return `p-${(h >>> 0).toString(16)}`;
}

/**
 * URL-safe slug: lowercase, spaces/specials → hyphens; keeps Unicode letters (Latin + Thai, etc.) and digits.
 */
export function generateSlug(name: string): string {
  if (typeof name !== "string") return "";
  const s = name
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  if (s) return s.slice(0, 180);
  return slugFallbackFromName(name).slice(0, 180);
}

/** Prefer explicit slug; otherwise derive from name (never empty). */
export function resolveProductSlugFromName(
  name: string,
  slugInput: string | null | undefined
): string {
  const raw = slugInput?.trim();
  if (raw) return raw.slice(0, 180);
  const g = generateSlug(name);
  return g || slugFallbackFromName(name).slice(0, 180);
}

/** Storefront path: prefer slug, fall back to numeric id for legacy rows. */
export function productDetailHref(product: {
  id: number;
  slug?: string | null;
}): string {
  const s = product.slug?.trim();
  if (s) return `/product/${encodeURIComponent(s)}`;
  return `/product/${product.id}`;
}

/** Extra standalone words to strip (case-insensitive, word boundaries). */
const EXTRA_NOISE_WORDS = ["Pack", "Seeds"] as const;

/**
 * Cleans a cannabis strain name by removing unnecessary attributes, feminized markers,
 * and calendar years (2000–2029) to make it professional and SEO-friendly.
 *
 * Does **not** strip two-digit numbers that are part of a strain name (e.g. `47` in `AK-47`).
 * Years are matched only as full four-digit tokens `20xx` with word boundaries.
 *
 * @param name The raw strain name from a sheet or external source. `null` / `undefined` / non-string yields `""`.
 * @returns A cleaned, trimmed string (may be empty).
 */
export function cleanStrainName(name: string | null | undefined): string {
  if (name == null || typeof name !== "string") return "";
  let s = name.trim();
  if (!s) return "";

  // Longer parenthetical phrases first
  s = s.replace(/\(\s*FEMINIZED\s*\)/gi, "");
  s = s.replace(/\(\s*FEM\s*\)/gi, "");
  s = s.replace(/\(\s*Fem\s*\)/gi, "");
  s = s.replace(/\(\s*fem\s*\)/gi, "");
  s = s.replace(/\(\s*FAST\s*\)/gi, "");
  s = s.replace(/\(\s*FF\s*\)/gi, "");

  // Years inside parentheses, e.g. (2023)
  s = s.replace(/\(\s*20[0-2][0-9]\s*\)/g, "");

  // Standalone years 2000–2029 only (\b avoids touching "47" in AK-47)
  s = s.replace(/\b20[0-2][0-9]\b/g, "");

  // Hyphen/em-dash separated suffixes
  s = s.replace(/\s*[-–—]\s*FEMINIZED\b/gi, "");
  s = s.replace(/\s*[-–—]\s*FEM\b/gi, "");

  // Standalone feminized markers as words
  s = s.replace(/\bFEMINIZED\b/gi, "");
  s = s.replace(/\bFEM\b/gi, "");

  for (const w of EXTRA_NOISE_WORDS) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "gi"), "");
  }

  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/[-–—]\s*$/g, "").trim();

  return s;
}

/** Sum variant stock (skips inactive when `is_active` is false). */
export function computeTotalStock(
  variants: Pick<ProductVariant, "stock" | "is_active">[] | null | undefined
): number {
  if (!variants?.length) return 0;
  return variants.reduce((sum, v) => {
    if (v.is_active === false) return sum;
    const q = Number(v.stock);
    return sum + (Number.isFinite(q) ? Math.max(0, q) : 0);
  }, 0);
}

/**
 * Lowest retail price among in-stock variants; if none in stock, lowest price among priced variants.
 */
type StartingVariantPick = Pick<
  ProductVariant,
  "price" | "stock" | "is_active" | "unit_label"
> &
  Partial<Pick<ProductVariant, "discount_percent" | "discount_ends_at" | "final_price">>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeDiscountPercent(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.floor(n)));
}

/**
 * @deprecated Storefront and cart ignore `discount_percent` / `discount_ends_at`; use `brand_promotions` + variant `price`.
 * Kept for backwards compatibility; always false so flash-sale UI does not trigger.
 */
export function isVariantDiscountActive(
  _variant: Partial<Pick<ProductVariant, "discount_percent" | "discount_ends_at">>,
  _now: Date = new Date()
): boolean {
  return false;
}

/** List price only (`product_variants.price`). Legacy variant % is ignored — see `brand_promotions`. */
export function getVariantFinalPrice(
  variant: Pick<ProductVariant, "price"> & Partial<Pick<ProductVariant, "discount_percent" | "discount_ends_at" | "final_price">>
): number {
  const price = Number(variant.price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return 0;
  return roundMoney(price);
}

/** @deprecated Variant timed discount ignored; returns `roundMoney(price)`. */
export function calculateDiscountedPrice(
  price: number,
  _discountPercent: unknown,
  _discountEndsAt?: string | null
): number {
  return getVariantFinalPrice({ price });
}

export type TimeRemaining = {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getTimeRemaining(endsAt: Date): TimeRemaining | null {
  const endMs = endsAt.getTime();
  if (!Number.isFinite(endMs)) return null;
  const totalMs = endMs - Date.now();
  if (totalMs <= 0) return null;
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Variant that determines `computeStartingPrice` (in-stock priced tiers preferred;
 * tie-break: smallest pack count from `unit_label`).
 */
export function getStartingVariant<T extends StartingVariantPick>(
  variants: T[] | null | undefined
): T | null {
  if (!variants?.length) return null;
  const active = variants.filter((v) => v.is_active !== false);
  type Row = { v: T; price: number; stock: number };
  const rows: Row[] = active.map((v) => ({
    v,
    price: Number(v.price ?? 0),
    stock: Number(v.stock ?? 0),
  }));
  const priced = rows.filter((r) => r.price > 0);
  if (priced.length === 0) return null;
  const inStock = priced.filter((r) => r.stock > 0);
  const pool = inStock.length > 0 ? inStock : priced;
  const minPrice = Math.min(...pool.map((r) => r.price));
  const tied = pool.filter((r) => r.price === minPrice);
  tied.sort(
    (a, b) =>
      parsePackFromUnitLabel(a.v.unit_label) - parsePackFromUnitLabel(b.v.unit_label)
  );
  return tied[0]?.v ?? null;
}

export function computeStartingPrice(
  variants: Pick<ProductVariant, "price" | "stock" | "is_active">[] | null | undefined
): number {
  const v = getStartingVariant(
    variants as StartingVariantPick[] | null | undefined
  );
  if (!v) return 0;
  return Number(v.price ?? 0);
}

type ClearanceProductSlice = {
  is_clearance?: boolean | null;
  sale_price?: unknown;
  product_variants?: (Pick<ProductVariant, "price" | "stock" | "is_active"> &
    Partial<
      Pick<
        ProductVariant,
        | "discount_percent"
        | "discount_ends_at"
        | "final_price"
        | "unit_label"
        | "clearance_price"
      >
    >)[] | null;
  price?: number | null;
};

type VariantClearancePick = Pick<ProductVariant, "price"> &
  Partial<Pick<ProductVariant, "clearance_price">>;

/** Min variant clearance for card/listing; falls back to legacy product.sale_price. */
export function deriveClearanceSalePrice(
  isClearance: boolean | null | undefined,
  variants: { clearance_price?: number | null }[],
  fallbackSalePrice?: number | null
): number | null {
  if (isClearance !== true) return null;
  const prices = variants
    .map((v) => Number(v.clearance_price ?? 0))
    .filter((p) => p > 0);
  if (prices.length > 0) return Math.min(...prices);
  const legacy = Number(fallbackSalePrice ?? 0);
  return legacy > 0 ? legacy : null;
}

function resolveVariantClearancePrice(
  variant: VariantClearancePick | undefined,
  product: ClearanceProductSlice,
  variantListPrice: number
): number | null {
  if (product.is_clearance !== true) return null;
  const list = Number(variantListPrice);
  if (!Number.isFinite(list) || list <= 0) return null;

  const explicit = Number(variant?.clearance_price ?? 0);
  if (explicit > 0) {
    return roundMoney(Math.min(list, explicit));
  }

  const sale = Number(product.sale_price ?? 0);
  if (sale <= 0) return null;

  const base = computeStartingPrice(product.product_variants);
  if (base <= 0) return roundMoney(Math.min(list, sale));
  return roundMoney(
    Math.min(list, Math.max(1, roundMoney(sale * (list / base))))
  );
}

/** Storefront “from” price: list/`price` + optional clearance; variant `discount_percent` is ignored (use `brand_promotions`). */
export function getEffectiveListingPrice(product: ClearanceProductSlice): number {
  const regular = computeStartingPrice(product.product_variants);
  if (product.is_clearance === true) {
    const starting = getStartingVariant(
      product.product_variants as StartingVariantPick[] | null | undefined
    );
    if (starting) {
      const list = Number(starting.price ?? 0);
      const eff = resolveVariantClearancePrice(starting, product, list);
      if (eff != null && eff > 0) return eff;
    }
    const sale = Number(product.sale_price ?? 0);
    if (sale > 0) return regular > 0 ? Math.min(sale, regular) : sale;
  }
  if (regular > 0) return regular;
  const p = Number(product.price ?? 0);
  return Number.isFinite(p) ? p : 0;
}

type BrandListingSortSlice = {
  brand_listing_base_baht?: number;
  brand_listing_effective_baht?: number;
};

/** Card-aligned “from” price for catalog sorting (brand promo effective, else clearance/list). */
export function getCatalogCardSortPrice(
  product: ClearanceProductSlice & BrandListingSortSlice
): number {
  const base = Number(product.brand_listing_base_baht ?? 0);
  const eff = Number(product.brand_listing_effective_baht ?? 0);
  if (base > 0 && eff > 0 && eff < base) return eff;
  return getEffectiveListingPrice(product);
}

/**
 * Per-pack clearance: uses variant `clearance_price` when set; otherwise legacy ratio from product `sale_price`.
 */
export function getEffectiveVariantPrice(
  product: ClearanceProductSlice,
  variantListPrice: number
): number {
  const variant = product.product_variants?.find(
    (v) => Number(v.price ?? 0) === Number(variantListPrice)
  );
  return getEffectiveVariantPriceForVariant(product, variant, variantListPrice);
}

export function getEffectiveVariantPriceForVariant(
  product: ClearanceProductSlice,
  variant: VariantClearancePick | undefined,
  variantListPrice: number
): number {
  const directPrice = variant ? getVariantFinalPrice(variant) : variantListPrice;
  if (product.is_clearance !== true) return directPrice;
  const clearance = resolveVariantClearancePrice(variant, product, variantListPrice);
  if (clearance != null) return clearance;
  return directPrice;
}

export function getClearancePercentOff(product: ClearanceProductSlice): number | null {
  if (product.is_clearance !== true) return null;
  const starting = getStartingVariant(
    product.product_variants as StartingVariantPick[] | null | undefined
  );
  if (!starting) return null;
  const regular = Number(starting.price ?? 0);
  if (regular <= 0) return null;
  const eff = resolveVariantClearancePrice(starting, product, regular);
  if (eff == null || eff <= 0 || regular <= eff) return null;
  return Math.round((1 - eff / regular) * 100);
}

/**
 * Detail page: never show ฿0 when the selected pack is OOS or prices are bad — use denormalized
 * `product.price` or the first active variant’s list price for clearance math.
 */
export function getDetailDisplayLinePrices(
  product: ClearanceProductSlice,
  activeVariantsSorted: ProductVariant[],
  selected: ProductVariant | null
): { eff: number; list: number } {
  if (!selected) return { eff: 0, list: 0 };
  const list = Number(selected.price ?? 0);
  let eff = getEffectiveVariantPrice(product, list);
  const variantOos = (selected.stock ?? 0) <= 0;
  const bad =
    variantOos ||
    !Number.isFinite(eff) ||
    eff <= 0 ||
    !Number.isFinite(list) ||
    list <= 0;
  if (bad) {
    const denorm = Number(product.price ?? 0);
    if (denorm > 0) {
      eff = getEffectiveVariantPrice(product, denorm);
    }
    if (!Number.isFinite(eff) || eff <= 0) {
      const v0 = activeVariantsSorted[0];
      if (v0) {
        const lp = Number(v0.price ?? 0);
        if (lp > 0) {
          eff = getEffectiveVariantPrice(product, lp);
        }
      }
    }
  }
  let listOut = list;
  if (!Number.isFinite(listOut) || listOut <= 0) {
    const d = Number(product.price ?? 0);
    if (d > 0) listOut = d;
    else if (activeVariantsSorted[0]) {
      listOut = Number(activeVariantsSorted[0].price ?? 0);
    }
  }
  return { eff, list: listOut };
}

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** True when aggregate stock is at or below threshold (0 = out / very low). */
export function isLowStock(
  stock: number | null | undefined,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): boolean {
  const n = stock == null ? 0 : Number(stock);
  if (!Number.isFinite(n) || n < 0) return false;
  return n <= threshold;
}

/** Card / listing line for the starting-price pack (TH/EN via `locales`). */
export function getStartingVariantLabel(
  variants: StartingVariantPick[] | null | undefined,
  locale: "th" | "en"
): string | null {
  const v = getStartingVariant(variants);
  if (!v) return null;
  return getPackSizeLabelFromUnitLabel(v.unit_label, locale);
}

/** TH/EN pack line from `unit_label` (same template as catalog card). */
export function getPackSizeLabelFromUnitLabel(
  unitLabel: string | null | undefined,
  locale: "th" | "en"
): string | null {
  if (!unitLabel?.trim()) return null;
  const n = parsePackFromUnitLabel(unitLabel);
  const template =
    getMessage(locale, "product.card_seeds_pack") ??
    (locale === "th" ? "แพ็กเกจ {n} เมล็ด" : "{n} Seeds Pack");
  return template.replace(/\{n\}/g, String(n));
}
