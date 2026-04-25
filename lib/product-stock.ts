/**
 * Aggregate stock on `products` (sum / denormalized) — same source as catalog cards.
 */
export function getProductAggregateStock(product: { stock?: number | null }): number {
  const n = Number(product.stock ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function isProductAggregateOutOfStock(product: { stock?: number | null }): boolean {
  return getProductAggregateStock(product) <= 0;
}
