import {
  applyBrandPercentToUnitBaht,
  matchBrandPromotionRule,
  type BrandPromotionRuleRow,
} from "@/lib/brand-promotion-checkout";
import { roundCheckoutBahtWhole } from "@/lib/money-thb";

export type CheckoutUnitPriceSource = "variant" | "product_fallback" | "brand_promotion" | "clearance";

export type CheckoutClearanceInput = {
  isClearance?: boolean | null;
  variantClearancePrice?: unknown;
  productSalePrice?: unknown;
  productStartingPrice?: unknown;
};

export function coerceCheckoutBaht(raw: unknown): number {
  if (raw == null) return NaN;
  if (
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as { toString?: () => string }).toString === "function"
  ) {
    const n = Number((raw as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : NaN;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export function resolveCheckoutClearanceUnitBaht(
  baseUnitBaht: number,
  clearance?: CheckoutClearanceInput | null,
): number | null {
  const base = roundCheckoutBahtWhole(baseUnitBaht);
  if (clearance?.isClearance !== true || base <= 0) return null;

  const explicit = coerceCheckoutBaht(clearance.variantClearancePrice);
  if (explicit > 0) return roundCheckoutBahtWhole(Math.min(base, explicit));

  const sale = coerceCheckoutBaht(clearance.productSalePrice);
  if (sale <= 0) return null;

  const starting = coerceCheckoutBaht(clearance.productStartingPrice);
  if (starting <= 0) return roundCheckoutBahtWhole(Math.min(base, sale));

  return roundCheckoutBahtWhole(Math.min(base, Math.max(1, sale * (base / starting))));
}

export function resolveCheckoutLineUnitBaht(input: {
  baseUnitBaht: number;
  baseSource?: "variant" | "product_fallback";
  breederName?: string | null;
  brandRules: BrandPromotionRuleRow[];
  clearance?: CheckoutClearanceInput | null;
}): { baseBaht: number; unitBaht: number; source: CheckoutUnitPriceSource } {
  const baseBaht = roundCheckoutBahtWhole(input.baseUnitBaht);
  const rule = matchBrandPromotionRule(input.brandRules, input.breederName);
  if (rule && rule.discount_percent > 0 && baseBaht > 0) {
    return {
      baseBaht,
      unitBaht: applyBrandPercentToUnitBaht(baseBaht, rule.discount_percent),
      source: "brand_promotion",
    };
  }

  const clearanceBaht = resolveCheckoutClearanceUnitBaht(baseBaht, input.clearance);
  if (clearanceBaht != null) {
    return { baseBaht, unitBaht: clearanceBaht, source: "clearance" };
  }

  return { baseBaht, unitBaht: baseBaht, source: input.baseSource ?? "variant" };
}
