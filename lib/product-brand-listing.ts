import type { BrandPromotionRuleRow } from "@/lib/brand-promotion-checkout";

export type {
  ListingBaseProduct,
  ProductWithBrandListing,
} from "@/lib/brand-listing-attach";
export {
  attachBrandListingFields,
  enrichProductsWithBrandListing,
} from "@/lib/brand-listing-attach";

/** Brand checkout promotions retired — always empty (DB table retained). */
export async function loadActiveBrandPromotionRules(): Promise<BrandPromotionRuleRow[]> {
  return [];
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
