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

const BRAND_RULES_CACHE_TTL_MS = 60_000;
let brandRulesCache: { rules: BrandPromotionRuleRow[]; at: number } | null = null;

/** Cached brand rules for catalog list (avoids Prisma round-trip per page). */
export async function loadActiveBrandPromotionRulesCached(): Promise<BrandPromotionRuleRow[]> {
  const now = Date.now();
  if (brandRulesCache && now - brandRulesCache.at < BRAND_RULES_CACHE_TTL_MS) {
    return brandRulesCache.rules;
  }
  const rules = await loadActiveBrandPromotionRules();
  brandRulesCache = { rules, at: now };
  return rules;
}
