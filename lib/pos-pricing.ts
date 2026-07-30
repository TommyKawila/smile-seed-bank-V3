import { applyWholesalePrice } from "@/lib/wholesale-utils";
import {
  getEffectiveVariantPrice,
  getVariantFinalPrice,
} from "@/lib/product-utils";
import type { ProductVariantRow } from "@/lib/supabase/types";

export type PosClearanceProductSlice = {
  is_clearance?: boolean | null;
  sale_price?: unknown;
  clearance_discount_percent?: number | null;
  product_variants?: (Pick<ProductVariantRow, "price" | "stock" | "is_active"> &
    Partial<
      Pick<
        ProductVariantRow,
        "discount_percent" | "discount_ends_at" | "unit_label" | "clearance_price"
      > & { final_price?: number }
    >)[] | null;
  price?: number | null;
};

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
 * Clearance via `getEffectiveVariantPrice` when `product.is_clearance`; optional wholesale on top.
 */
export function resolvePosVariantUnitPrice(
  variant: ProductVariantRow & { final_price?: number },
  wholesaleDiscountPercent: number,
  product?: PosClearanceProductSlice | null
): PosVariantPricing {
  const baseList = Number(variant.price ?? 0);
  let finalRetail =
    typeof variant.final_price === "number" &&
    Number.isFinite(variant.final_price) &&
    variant.final_price > 0
      ? variant.final_price
      : getVariantFinalPrice(variant);

  if (product?.is_clearance === true && baseList > 0) {
    const withVariant = {
      ...product,
      product_variants: product.product_variants?.length
        ? product.product_variants
        : [variant],
    };
    const clearance = getEffectiveVariantPrice(withVariant, baseList);
    if (clearance > 0) finalRetail = clearance;
  }

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
