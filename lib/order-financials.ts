/**
 * Single source of truth for storefront cart fallbacks, quotations, and PDFs.
 * Storefront shipping rule: 50 THB, free when net amount after discounts is at least 1,000 THB.
 */
export const QUOTATION_SHIPPING_FREE_THRESHOLD = 1000;
export const QUOTATION_SHIPPING_COST = 50;

/** Core fee rule: free when net amount before shipping reaches threshold. */
export function shippingFeeForSubtotal(
  netAmountBeforeShipping: number,
  freeShippingThreshold: number = QUOTATION_SHIPPING_FREE_THRESHOLD,
  baseFee: number = QUOTATION_SHIPPING_COST
): number {
  const s = Math.max(0, Number(netAmountBeforeShipping) || 0);
  const t = Math.max(0, Number(freeShippingThreshold) || 0);
  const f = Math.max(0, Number(baseFee) || 0);
  return s >= t ? 0 : f;
}

export function defaultQuotationShippingFee(itemsSubtotal: number): number {
  return shippingFeeForSubtotal(itemsSubtotal);
}
