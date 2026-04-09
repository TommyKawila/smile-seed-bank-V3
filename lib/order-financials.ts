/**
 * Single source of truth for storefront cart fallbacks, quotations, and PDFs.
 * Semantics match `shipping_rules`: free when `subtotal >= free_shipping_threshold`.
 */
export const QUOTATION_SHIPPING_FREE_THRESHOLD = 1000;
export const QUOTATION_SHIPPING_COST = 50;

/** Core fee rule: free at or above threshold (same as `calculateShipping` + DB rules). */
export function shippingFeeForSubtotal(
  subtotal: number,
  freeShippingThreshold: number = QUOTATION_SHIPPING_FREE_THRESHOLD,
  baseFee: number = QUOTATION_SHIPPING_COST
): number {
  const s = Math.max(0, Number(subtotal) || 0);
  const t = Math.max(0, Number(freeShippingThreshold) || 0);
  const f = Math.max(0, Number(baseFee) || 0);
  return s >= t ? 0 : f;
}

export function defaultQuotationShippingFee(itemsSubtotal: number): number {
  return shippingFeeForSubtotal(itemsSubtotal);
}
