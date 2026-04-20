import { computeTotalStock } from "@/lib/product-utils";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import type { ProductVariantRow, ProductWithBreeder } from "@/lib/supabase/types";


type Listable = ProductWithBreeder & {
  product_variants?: ProductVariantRow[] | null;
};

function hasSellableStock(p: Listable): boolean {
  if (p.product_variants?.length) return computeTotalStock(p.product_variants) > 0;
  return Math.max(0, Math.floor(Number(p.stock ?? 0))) > 0;
}

function salesCount(p: Listable): number {
  const v = (p as { sales_count?: number | null }).sales_count;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function vaultFeaturedSort(a: Listable, b: Listable): number {
  const fa = a.is_featured === true ? 1 : 0;
  const fb = b.is_featured === true ? 1 : 0;
  if (fb !== fa) return fb - fa;

  const pa = a.featured_priority ?? 1_000_000;
  const pb = b.featured_priority ?? 1_000_000;
  if (pa !== pb) return pa - pb;

  const sa = salesCount(a);
  const sb = salesCount(b);
  if (sb !== sa) return sb - sa;

  const ia = getListingThumbnailUrl(a) ? 1 : 0;
  const ib = getListingThumbnailUrl(b) ? 1 : 0;
  if (ib !== ia) return ib - ia;

  const ta = new Date(a.created_at ?? 0).getTime();
  const tb = new Date(b.created_at ?? 0).getTime();
  return tb - ta;
}

/**
 * Top strains for the Genetic Vault hero carousel: current filter slice, active + in stock,
 * then is_featured → featured_priority → optional sales_count → listing image → created_at.
 */
export function selectVaultFeaturedProducts<T extends Listable>(
  products: T[],
  options?: { max?: number }
): T[] {
  const cap = Math.min(8, Math.max(1, options?.max ?? 8));
  const eligible = products.filter(
    (p) => p.is_active !== false && hasSellableStock(p)
  );
  eligible.sort(vaultFeaturedSort);
  return eligible.slice(0, cap);
}
