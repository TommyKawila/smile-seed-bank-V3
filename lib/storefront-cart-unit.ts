import {
  resolveListingUnitAfterBrand,
  type BrandPromotionRuleRow,
} from "@/lib/brand-promotion-checkout";
import { getEffectiveVariantPrice } from "@/lib/product-utils";
import { roundCheckoutBahtWhole } from "@/lib/money-thb";

type ClearanceSlice = Parameters<typeof getEffectiveVariantPrice>[0];

/**
 * Unit baht stored on cart add.
 * Brand sale → list (cart/checkout apply brand %).
 * Else clearance → effective clearance; else list.
 */
export function resolveStorefrontCartStoredUnitBaht(
  product: ClearanceSlice,
  variantListPrice: number,
  breederName: string | null | undefined,
  brandRules: BrandPromotionRuleRow[],
): number {
  const list = roundCheckoutBahtWhole(variantListPrice);
  const brandLine = resolveListingUnitAfterBrand(list, breederName ?? null, brandRules);
  if (brandLine.effectiveBaht < brandLine.baseBaht && brandLine.baseBaht > 0) {
    return list;
  }
  return roundCheckoutBahtWhole(getEffectiveVariantPrice(product, list));
}
