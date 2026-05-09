import type { CartItem, CartSummary, DiscountTier, ShippingRule, Promotion } from "@/types/supabase";
import {
  QUOTATION_SHIPPING_COST,
  QUOTATION_SHIPPING_FREE_THRESHOLD,
  shippingFeeForSubtotal,
} from "@/lib/order-financials";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";
import { formatPrice } from "@/lib/utils";
import {
  type TieredDiscountRule,
  evaluateTieredDiscountBySpend,
  evaluateDiscountTier,
  resolveExclusiveCartDiscounts,
  type PromoInfo as DiscountPromoInfo,
} from "@/lib/discount-utils";
import { bahtToSatangInt, quantizeBaht2, satangIntToBaht } from "@/lib/money-thb";

export type { TieredDiscountRule };
export { evaluateTieredDiscountBySpend, evaluateDiscountTier };

export function generateUpsellMessage(
  subtotal: number,
  tiers: DiscountTier[],
  tieredRules?: TieredDiscountRule[]
): string | null {
  // Tiered (spend-based) upsell
  if (tieredRules && tieredRules.length > 0) {
    const nextTier = tieredRules
      .filter((r) => r.min_spend > subtotal)
      .sort((a, b) => a.min_spend - b.min_spend)[0];
    if (nextTier) {
      const gap = nextTier.min_spend - subtotal;
      return `ซื้ออีก ฿${gap.toLocaleString("th-TH")} เพื่อรับส่วนลด ${nextTier.discount_percent}%`;
    }
  }
  // discount_tiers (subtotal-based) upsell
  const activeTiers = tiers.filter((t) => t.is_active);
  const nextTier = activeTiers
    .filter((t) => t.min_amount > subtotal)
    .sort((a, b) => a.min_amount - b.min_amount)[0];
  if (!nextTier) return null;
  const gap = nextTier.min_amount - subtotal;
  return `ซื้ออีก ${formatPrice(gap)} เพื่อรับส่วนลด ${nextTier.discount_percentage}%`;
}

function resolveShippingParams(
  _category: string,
  _rules: ShippingRule[] | null | undefined
): { threshold: number; fee: number } {
  return {
    threshold: QUOTATION_SHIPPING_FREE_THRESHOLD,
    fee: QUOTATION_SHIPPING_COST,
  };
}

/** Storefront checkout shipping is fixed: 50 THB, free when net amount after discounts reaches 1,000 THB. */
export function calculateShipping(
  category: string,
  netAmountBeforeShipping: number,
  rules: ShippingRule[] | null | undefined
): number {
  const { threshold, fee } = resolveShippingParams(category, rules);
  return shippingFeeForSubtotal(netAmountBeforeShipping, threshold, fee);
}

export function evaluateFreeGifts(
  cartItems: CartItem[],
  promotions: Promotion[],
  paymentMethod?: string
): Promotion[] {
  const subtotal = cartItems
    .filter((i) => !i.isFreeGift)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  return promotions.filter((promo) => {
    switch (promo.condition_type) {
      case "MIN_SPEND":
        return subtotal >= Number(promo.condition_value);
      case "PAYMENT_METHOD":
        return !!paymentMethod && paymentMethod.toLowerCase() === promo.condition_value.toLowerCase();
      case "TIME_RANGE": {
        const [start, end] = promo.condition_value.split(",");
        const now = new Date();
        return now >= new Date(start) && now <= new Date(end);
      }
      default:
        return false;
    }
  });
}

export type PromoInfo = DiscountPromoInfo;

export function calculateCartSummary(
  items: CartItem[],
  tiers: DiscountTier[],
  shippingRules: ShippingRule[],
  primaryCategory: string = STOREFRONT_SHIPPING_CATEGORY,
  _legacyPromoDiscount: number = 0,
  tieredRules?: TieredDiscountRule[],
  promoInfo?: PromoInfo | null
): CartSummary {
  const subtotalSatang = items
    .filter((i) => !i.isFreeGift)
    .reduce((sum, i) => sum + bahtToSatangInt(i.price * i.quantity), 0);
  const subtotal = quantizeBaht2(satangIntToBaht(subtotalSatang));

  const rules = tieredRules?.length ? tieredRules : [];
  const exclusive = resolveExclusiveCartDiscounts({
    subtotal,
    tieredRules: rules,
    discountTiers: tiers,
    promoInfo: promoInfo ?? null,
  });

  const { tierDiscount, promoDiscount: promoDiscountAmount, eligibleTierPercent } = exclusive;
  const discountSatang =
    bahtToSatangInt(tierDiscount) + bahtToSatangInt(promoDiscountAmount);
  const discount = quantizeBaht2(satangIntToBaht(discountSatang));
  const normalizedDiscountSatang = bahtToSatangInt(discount);
  const merchSatang = subtotalSatang - normalizedDiscountSatang;
  const netAmountBeforeShipping = quantizeBaht2(satangIntToBaht(merchSatang));
  const shipping = calculateShipping(primaryCategory, netAmountBeforeShipping, shippingRules);

  const appliedTier = evaluateDiscountTier(subtotal, tiers);

  const grandSatang =
    merchSatang + bahtToSatangInt(shipping);
  const total = quantizeBaht2(satangIntToBaht(grandSatang));

  return {
    subtotal,
    discount,
    discountPercent: eligibleTierPercent,
    tierDiscount,
    promoDiscount: promoDiscountAmount,
    shipping,
    total,
    appliedTier: appliedTier ?? null,
    upsellMessage: generateUpsellMessage(subtotal, tiers, tieredRules),
    usePromoForOrder: exclusive.usePromoForOrder,
    promoSupersededByTier: exclusive.promoSupersededByTier,
  };
}
