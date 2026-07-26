/** Build Shopee TH search URL, optionally wrapped with affiliate an_redir. */

function slugifySubId(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "item";
}

export function buildShopeeSearchUrl(keyword: string): string {
  const q = keyword.trim();
  return `https://shopee.co.th/search?keyword=${encodeURIComponent(q)}`;
}

/**
 * Affiliate deep link for Thailand.
 * Env: SHOPEE_AFFILIATE_ID — if missing, returns plain search URL.
 */
export function buildShopeeAffiliateSearchUrl(
  keyword: string,
  subIdPrefix = "soil-mixer"
): string {
  const origin = buildShopeeSearchUrl(keyword);
  const affiliateId = process.env.SHOPEE_AFFILIATE_ID?.trim();
  if (!affiliateId) return origin;

  const params = new URLSearchParams({
    origin_link: origin,
    affiliate_id: affiliateId,
    sub_id: `${subIdPrefix}-${slugifySubId(keyword)}`,
  });
  return `https://s.shopee.co.th/an_redir?${params.toString()}`;
}
