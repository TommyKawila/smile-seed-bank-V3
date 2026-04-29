import { generateSlug } from "@/lib/product-utils";

/** URL query value for `?breeder=` — stable slug from breeder name (same as storefront SEO slugs). */
export function breederSlugFromName(name: string): string {
  return generateSlug(name);
}

/** Storefront catalog URL for a breeder (journal path). */
export function seedsBreederHref(b: { name: string }): string {
  return `/seeds/${breederSlugFromName(b.name)}`;
}

/**
 * Resolve `?breeder=` from slug (preferred) or legacy numeric id.
 * Invalid values → null (caller may redirect to /shop).
 */
export function resolveBreederFromShopParam<B extends { id: number; name: string }>(
  breeders: B[],
  param: string | null | undefined
): B | null {
  if (param == null || param === "") return null;
  const raw = param.trim();
  if (!raw) return null;
  if (!breeders.length) return null;

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    if (!Number.isSafeInteger(id)) return null;
    return breeders.find((b) => Number(b.id) === id) ?? null;
  }

  const want = raw.toLowerCase();
  return (
    breeders.find((b) => breederSlugFromName(b.name).toLowerCase() === want) ?? null
  );
}
