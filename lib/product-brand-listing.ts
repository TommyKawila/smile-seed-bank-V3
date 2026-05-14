import { prisma } from "@/lib/prisma";
import { activeBrandRulesFromRows, type BrandPromotionRuleRow } from "@/lib/brand-promotion-checkout";

export type {
  ListingBaseProduct,
  ProductWithBrandListing,
} from "@/lib/brand-listing-attach";
export {
  attachBrandListingFields,
  enrichProductsWithBrandListing,
} from "@/lib/brand-listing-attach";

/** Server / API only — loads rules from DB. */
export async function loadActiveBrandPromotionRules(): Promise<BrandPromotionRuleRow[]> {
  const rows = await prisma.brand_promotions.findMany({
    where: { is_active: true },
    orderBy: { id: "asc" },
  });
  return activeBrandRulesFromRows(
    rows.map((r) => ({
      brand_name: r.brand_name,
      discount_percent: r.discount_percent,
      is_active: r.is_active,
    })),
  );
}
