/**
 * POS order creation — promotion highlight helpers (tier/code discounts live in `useCart`).
 */

export type PromotionRule = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  conditions: unknown;
  discount_value: number | null;
};

export type PosPromotionApplyResult = {
  promotionDiscount: number;
  activePromotion: PromotionRule | null;
  buyXGetYAlert: { name: string; getQty: number } | null;
  freebieAlert: { description: string } | null;
};

/** Reserved for future rule engine; keeps POS summary badges/alerts typed. */
export function applyPromotions(
  _items: unknown[],
  _promotions: PromotionRule[],
  _productIdToBreeder: Map<number, number>
): PosPromotionApplyResult {
  return {
    promotionDiscount: 0,
    activePromotion: null,
    buyXGetYAlert: null,
    freebieAlert: null,
  };
}
