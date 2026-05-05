/**
 * Wildcard-safe fragment for Supabase `.or()` catalog search (PostgreSQL ILIKE).
 * DB uses `products.name` plus TH/EN description columns (no separate name_th/name_en).
 */
export function postgrestWildcardTerm(value: string): string {
  return `%${value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ")}%`;
}

export function buildProductCatalogSearchOrFilter(search: string): string | null {
  const raw = search.trim();
  if (!raw) return null;
  const term = postgrestWildcardTerm(raw);
  return `name.ilike.${term},category.ilike.${term},description_th.ilike.${term},description_en.ilike.${term}`;
}
