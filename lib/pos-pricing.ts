import { applyWholesalePrice } from "@/lib/wholesale-utils";
import { getVariantFinalPrice } from "@/lib/product-utils";
import type { ProductVariantRow } from "@/lib/supabase/types";

export type PosVariantPricing = {
  baseList: number;
  finalRetail: number;
  /** Unit charge after list/final retail + optional wholesale. */
  unitCharge: number;
  /** Strikethrough list (with wholesale on that figure when applicable). */
  strikeDisplay: number;
  /** True when strikethrough list is above `unitCharge` (e.g. wholesale-only). */
  showListStrike: boolean;
};

/**
 * POS shelf + cart: list `price` / optional `final_price` from service (no variant-column flash %);
 * optional wholesale on top.
 */
export function resolvePosVariantUnitPrice(
  variant: ProductVariantRow & { final_price?: number },
  wholesaleDiscountPercent: number
): PosVariantPricing {
  const baseList = Number(variant.price ?? 0);
  const finalRetail =
    typeof variant.final_price === "number" &&
    Number.isFinite(variant.final_price) &&
    variant.final_price > 0
      ? variant.final_price
      : getVariantFinalPrice(variant);
  const unitCharge =
    wholesaleDiscountPercent > 0
      ? applyWholesalePrice(finalRetail, wholesaleDiscountPercent)
      : finalRetail;
  const strikeDisplay =
    wholesaleDiscountPercent > 0
      ? applyWholesalePrice(baseList, wholesaleDiscountPercent)
      : baseList;
  const showListStrike =
    strikeDisplay > 0 &&
    unitCharge > 0 &&
    Math.round(strikeDisplay * 100) > Math.round(unitCharge * 100);
  return {
    baseList,
    finalRetail,
    unitCharge,
    strikeDisplay,
    showListStrike,
  };
}
