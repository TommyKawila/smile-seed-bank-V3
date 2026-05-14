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

/** Alphanumeric-only fold for loose matching (e.g. "420 Fast Buds" ↔ "420fastbuds"). */
function brandKeyLoose(name: string | null | undefined): string {
  return normalizeBrandKey(name).replace(/[^a-z0-9]+/g, "");
}

const PROMO_BREEDER_CONTAIN_MIN_LEN = 4;

/** True if an active promo row's `brand_name` refers to this breeder display name (exact, folded, or substring). */
export function brandPromotionNamesMatch(
  promoBrandName: string | null | undefined,
  breederName: string | null | undefined,
): boolean {
  const pRaw = String(promoBrandName ?? "").trim();
  const bRaw = String(breederName ?? "").trim();
  if (!pRaw || !bRaw) return false;
  if (normalizeBrandKey(pRaw) === normalizeBrandKey(bRaw)) return true;
  const lp = brandKeyLoose(pRaw);
  const lb = brandKeyLoose(bRaw);
  if (lp.length >= 2 && lb.length >= 2 && lp === lb) return true;
  if (lp.length >= PROMO_BREEDER_CONTAIN_MIN_LEN && lb.length >= PROMO_BREEDER_CONTAIN_MIN_LEN) {
    return lb.includes(lp) || lp.includes(lb);
  }
  return false;
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

/** First matching rule by breeder name (normalized + loose fold / substring). */
export function matchBrandPromotionRule(
  rules: BrandPromotionRuleRow[],
  breederName: string | null | undefined,
): BrandPromotionRuleRow | null {
  if (!String(breederName ?? "").trim()) return null;
  for (const r of rules) {
    if (brandPromotionNamesMatch(r.brand_name, breederName)) return r;
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
