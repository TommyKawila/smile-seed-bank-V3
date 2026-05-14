import {
  resolveListingUnitAfterBrand,
  type BrandPromotionRuleRow,
} from "@/lib/brand-promotion-checkout";
import { getStartingVariant } from "@/lib/product-utils";
import type { ProductVariant } from "@/types/supabase";

export type ProductWithBrandListing = {
  brand_listing_base_baht: number;
  brand_listing_effective_baht: number;
  brand_promotion_percent: number | null;
};

export type ListingBaseProduct = {
  price?: number | null;
  breeders?: { name?: string | null } | null;
  product_variants?:
    | (Pick<ProductVariant, "price" | "stock" | "is_active" | "unit_label">)[]
    | null;
};

function listingRawBaseBaht(product: ListingBaseProduct): number {
  const sv = getStartingVariant(product.product_variants ?? null);
  const vp = sv ? Number(sv.price ?? 0) : 0;
  if (vp > 0) return vp;
  return Number(product.price ?? 0) || 0;
}

export function attachBrandListingFields<P extends ListingBaseProduct>(
  product: P,
  rules: BrandPromotionRuleRow[],
): P & ProductWithBrandListing {
  const raw = listingRawBaseBaht(product);
  const { baseBaht, effectiveBaht, brandDiscountPercent } = resolveListingUnitAfterBrand(
    raw,
    product.breeders?.name ?? null,
    rules,
  );
  return {
    ...product,
    brand_listing_base_baht: baseBaht,
    brand_listing_effective_baht: effectiveBaht,
    brand_promotion_percent: brandDiscountPercent,
  };
}

export function enrichProductsWithBrandListing<T extends ListingBaseProduct>(
  products: T[],
  rules: BrandPromotionRuleRow[],
): (T & ProductWithBrandListing)[] {
  return products.map((p) => attachBrandListingFields(p, rules));
}

export type { BrandPromotionRuleRow };
