import { applyWholesalePrice } from "@/lib/wholesale-utils";
import { getVariantFinalPrice } from "@/lib/product-utils";
import type { ProductVariantRow } from "@/lib/supabase/types";

export type PosVariantPricing = {
  baseList: number;
  finalRetail: number;
  /** Amount charged per unit after variant campaign + wholesale (cart / API line price). */
  unitCharge: number;
  /** List price shown struck-through before campaign (and wholesale on that list figure). */
  strikeDisplay: number;
  /** True when struck list figure is materially above `unitCharge` (bulk-only, wholesale-only, or both). */
  showListStrike: boolean;
};

/**
 * POS shelf + cart: align with storefront `getVariantFinalPrice` / `final_price` on variants
 * (bulk breeder discounts, timed `discount_ends_at`, then optional wholesale on top).
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
