type VariantStockPick = { stock?: number | null; is_active?: boolean | null };

/**
 * Total sellable stock: sum of `stock` for active variants when `product_variants` exist;
 * otherwise denormalized `product.stock` (list API may omit variants).
 */
export function getProductAggregateStock(product: {
  stock?: number | null;
  product_variants?: VariantStockPick[] | null;
}): number {
  const variants = product.product_variants;
  if (Array.isArray(variants) && variants.length > 0) {
    const active = variants.filter((v) => v.is_active !== false);
    if (active.length > 0) {
      return active.reduce((sum, v) => {
        const n = Number(v.stock ?? 0);
        if (!Number.isFinite(n)) return sum;
        return sum + Math.max(0, Math.floor(n));
      }, 0);
    }
  }
  const n = Number(product.stock ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function isProductAggregateOutOfStock(product: {
  stock?: number | null;
  product_variants?: VariantStockPick[] | null;
}): boolean {
  return getProductAggregateStock(product) <= 0;
}
