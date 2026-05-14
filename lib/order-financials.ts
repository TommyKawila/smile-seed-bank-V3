/**
 * Single source of truth for storefront cart fallbacks, quotations, and PDFs.
 * Thresholds: `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD` (default 1000), `NEXT_PUBLIC_SHIPPING_FEE` (default 50).
 */
function numberFromEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const QUOTATION_SHIPPING_FREE_THRESHOLD = numberFromEnv(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD,
  1000,
);

export const QUOTATION_SHIPPING_COST = numberFromEnv(
  process.env.NEXT_PUBLIC_SHIPPING_FEE,
  50,
);

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
