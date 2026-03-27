/** Aligns quotation PDF, convert-to-order, and stored shipping defaults */
export const QUOTATION_SHIPPING_FREE_THRESHOLD = 1000;
export const QUOTATION_SHIPPING_COST = 50;

export function defaultQuotationShippingFee(itemsSubtotal: number): number {
  const s = Math.max(0, Number(itemsSubtotal) || 0);
  return s <= QUOTATION_SHIPPING_FREE_THRESHOLD ? QUOTATION_SHIPPING_COST : 0;
}
