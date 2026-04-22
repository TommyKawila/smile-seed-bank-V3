import { getEffectiveListingPrice, getEffectiveVariantPrice } from "@/lib/product-utils";
import type { ProductListItem } from "@/hooks/useProducts";

export const PRICE_PARAM_MIN = "pmin";
export const PRICE_PARAM_MAX = "pmax";

export type PriceBudgetPreset = {
  id: string;
  labelTh: string;
  labelEn: string;
  min: number;
  max: number;
};

/** Upper bound for slider & open-ended presets; recomputed from catalog. */
export function computePriceSliderCap(products: ProductListItem[]): number {
  let hi = 5000;
  for (const p of products) {
    const start = getEffectiveListingPrice(p);
    if (start > hi) hi = start;
    for (const v of p.product_variants ?? []) {
      if (v.is_active === false) continue;
      const n = getEffectiveVariantPrice(p, Number(v.price ?? 0));
      if (n > hi) hi = n;
    }
  }
  return Math.min(99_999, Math.max(5000, Math.ceil(hi / 500) * 500));
}

export function budgetPresetsForCap(cap: number): PriceBudgetPreset[] {
  return [
    { id: "u500", labelTh: "ต่ำกว่า 500", labelEn: "Under 500", min: 0, max: 500 },
    { id: "500_1000", labelTh: "500 – 1,000", labelEn: "500 – 1,000", min: 500, max: 1000 },
    { id: "1000_2000", labelTh: "1,000 – 2,000", labelEn: "1,000 – 2,000", min: 1000, max: 2000 },
    { id: "2000p", labelTh: "2,000+", labelEn: "2,000+", min: 2000, max: cap },
  ];
}

export function parsePriceRangeParams(sp: { get: (k: string) => string | null }): {
  min: number | null;
  max: number | null;
} {
  const rawMin = sp.get(PRICE_PARAM_MIN);
  const rawMax = sp.get(PRICE_PARAM_MAX);
  let min = rawMin != null && rawMin !== "" ? Number(rawMin) : null;
  let max = rawMax != null && rawMax !== "" ? Number(rawMax) : null;
  min = min != null && Number.isFinite(min) ? min : null;
  max = max != null && Number.isFinite(max) ? max : null;
  if (max != null && min == null) min = 0;
  return { min, max };
}

export function activeBudgetPresetId(
  min: number | null,
  max: number | null,
  cap: number
): string | null {
  if (min == null || max == null) return null;
  for (const p of budgetPresetsForCap(cap)) {
    if (p.min === min && p.max === max) return p.id;
  }
  return null;
}

export function productMatchesPriceRange(
  product: ProductListItem,
  min: number | null,
  max: number | null
): boolean {
  if (min == null && max == null) return true;
  const price = getEffectiveListingPrice(product);
  if (price <= 0) return false;
  const lo = min ?? 0;
  const hi = max == null ? Infinity : max;
  return price >= lo && price <= hi;
}

export function priceFilterActive(min: number | null, max: number | null): boolean {
  return min != null || max != null;
}
