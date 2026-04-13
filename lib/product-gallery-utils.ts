/** Embedded row from Supabase `product_images` select */
export type ProductImageRow = {
  id: number;
  url: string;
  variant_id: number | null;
  is_main: boolean;
  sort_order: number;
};

export function normalizeProductImageRows(
  raw: unknown
): ProductImageRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const o = r as Record<string, unknown>;
      const id = Number(o.id);
      const url = typeof o.url === "string" ? o.url : "";
      if (!Number.isFinite(id) || !url.trim()) return null;
      return {
        id,
        url: url.trim(),
        variant_id: o.variant_id != null ? Number(o.variant_id) : null,
        is_main: Boolean(o.is_main),
        sort_order: Number(o.sort_order ?? 0),
      };
    })
    .filter((x): x is ProductImageRow => x != null)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

/** Shop / home card: prefer `is_main` row, else legacy columns */
export function getListingThumbnailUrl(product: {
  image_urls?: unknown;
  image_url?: string | null;
  product_images?: unknown;
}): string | null {
  const rows = normalizeProductImageRows(product.product_images);
  if (rows.length > 0) {
    const main = rows.find((r) => r.is_main) ?? rows[0];
    if (main?.url) return main.url;
  }
  if (Array.isArray(product.image_urls) && (product.image_urls as string[]).length > 0) {
    return (product.image_urls as string[])[0] ?? null;
  }
  return product.image_url ?? null;
}

/** Detail hero: variant image, else main, else first legacy */
export function resolveDetailHeroUrl(
  product: {
    image_urls?: unknown;
    image_url?: string | null;
    image_url_2?: string | null;
    image_url_3?: string | null;
    image_url_4?: string | null;
    image_url_5?: string | null;
    product_images?: unknown;
  },
  selectedVariantId: number | null
): string | null {
  const rows = normalizeProductImageRows(product.product_images);
  if (rows.length > 0 && selectedVariantId != null) {
    const hit = rows.find((r) => r.variant_id === selectedVariantId);
    if (hit?.url) return hit.url;
    const main = rows.find((r) => r.is_main) ?? rows[0];
    if (main?.url) return main.url;
  }
  if (rows.length > 0) {
    const main = rows.find((r) => r.is_main) ?? rows[0];
    if (main?.url) return main.url;
  }
  if (Array.isArray(product.image_urls) && (product.image_urls as string[]).length > 0) {
    const u = (product.image_urls as string[]).filter(Boolean);
    return u[0] ?? null;
  }
  return (
    [product.image_url, product.image_url_2, product.image_url_3, product.image_url_4, product.image_url_5].find(
      Boolean
    ) ?? null
  );
}

/** Thumbnail strip URLs (dedupe, preserve order) */
export function buildDetailGalleryUrls(
  product: {
    image_urls?: unknown;
    image_url?: string | null;
    image_url_2?: string | null;
    image_url_3?: string | null;
    image_url_4?: string | null;
    image_url_5?: string | null;
    product_images?: unknown;
  },
  selectedVariantId: number | null
): string[] {
  const rows = normalizeProductImageRows(product.product_images);
  const legacy =
    Array.isArray(product.image_urls) && (product.image_urls as string[]).length > 0
      ? ([...(product.image_urls as string[])] as string[])
      : ([product.image_url, product.image_url_2, product.image_url_3, product.image_url_4, product.image_url_5].filter(
          Boolean
        ) as string[]);

  if (rows.length === 0) {
    return [...new Set(legacy.map((u) => u.trim()).filter(Boolean))];
  }

  const ordered = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  const urls = ordered.map((r) => r.url.trim()).filter(Boolean);
  const hero = resolveDetailHeroUrl(product, selectedVariantId);
  const merged = hero ? [hero, ...urls.filter((u) => u !== hero)] : urls;
  return [...new Set(merged)];
}
