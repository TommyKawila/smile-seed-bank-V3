import { roundCheckoutBahtWhole } from "@/lib/money-thb";

export type BrandPromotionRuleRow = {
  brand_name: string;
  discount_percent: number;
  is_active: boolean;
};

export function normalizeBrandKey(name: string | null | undefined): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function activeBrandRulesFromRows(
  rows: { brand_name: string; discount_percent: number; is_active: boolean | null }[],
): BrandPromotionRuleRow[] {
  return rows
    .filter((r) => r.is_active !== false && String(r.brand_name ?? "").trim().length > 0)
    .map((r) => ({
      brand_name: String(r.brand_name).trim(),
      discount_percent: Math.max(0, Math.min(100, Math.trunc(Number(r.discount_percent) || 0))),
      is_active: true,
    }));
}

/** First matching rule by normalized breeder name (DB-driven only). */
export function matchBrandPromotionRule(
  rules: BrandPromotionRuleRow[],
  breederName: string | null | undefined,
): BrandPromotionRuleRow | null {
  const key = normalizeBrandKey(breederName);
  if (!key) return null;
  for (const r of rules) {
    if (normalizeBrandKey(r.brand_name) === key) return r;
  }
  return null;
}

/**
 * Apply brand % to unit Baht; round whole Baht immediately (checkout pipeline).
 * `discount_percent` = percent off (e.g. 10 → pay 90% of base).
 */
export function applyBrandPercentToUnitBaht(baseUnitBaht: number, discountPercent: number): number {
  const base = roundCheckoutBahtWhole(baseUnitBaht);
  const pct = Math.max(0, Math.min(100, Math.trunc(Number(discountPercent) || 0)));
  if (pct <= 0 || base <= 0) return base;
  return roundCheckoutBahtWhole((base * (100 - pct)) / 100);
}

/** Same pipeline as checkout listing unit: round base, then brand % (whole Baht). No rule → unchanged base. */
export function resolveListingUnitAfterBrand(
  baseUnitBaht: number,
  breederName: string | null | undefined,
  rules: BrandPromotionRuleRow[],
): { baseBaht: number; effectiveBaht: number; brandDiscountPercent: number | null } {
  const base = roundCheckoutBahtWhole(Number(baseUnitBaht) || 0);
  if (rules.length === 0) {
    return { baseBaht: base, effectiveBaht: base, brandDiscountPercent: null };
  }
  const rule = matchBrandPromotionRule(rules, breederName);
  if (!rule || rule.discount_percent <= 0 || base <= 0) {
    return { baseBaht: base, effectiveBaht: base, brandDiscountPercent: null };
  }
  return {
    baseBaht: base,
    effectiveBaht: applyBrandPercentToUnitBaht(base, rule.discount_percent),
    brandDiscountPercent: rule.discount_percent,
  };
}
