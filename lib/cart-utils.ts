import type { CartItem, CartSummary, ShippingRule, Promotion } from "@/types/supabase";
import {
  QUOTATION_SHIPPING_COST,
  QUOTATION_SHIPPING_FREE_THRESHOLD,
  shippingFeeForSubtotal,
} from "@/lib/order-financials";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";
import {
  matchBrandPromotionRule,
  applyBrandPercentToUnitBaht,
  type BrandPromotionRuleRow,
  activeBrandRulesFromRows,
} from "@/lib/brand-promotion-checkout";
import {
  computeCouponDiscountBahtOnSubtotal,
  isCouponPercentageType,
  type PromoInfo,
} from "@/lib/services/checkout-promo-math";
import { bahtToSatangInt, roundCheckoutBahtWhole, satangIntToBaht } from "@/lib/money-thb";

export type { BrandPromotionRuleRow };
export { activeBrandRulesFromRows };

/**
 * Free-shipping gap message (TH). Uses same threshold as `shippingFeeForSubtotal`.
 */
export function generateUpsellMessage(
  netAmountBeforeShipping: number,
  freeShippingThreshold: number = QUOTATION_SHIPPING_FREE_THRESHOLD,
): string | null {
  const net = roundCheckoutBahtWhole(netAmountBeforeShipping);
  const threshold = Math.max(0, Number(freeShippingThreshold) || 0);
  if (threshold <= 0 || net >= threshold) return null;
  const gap = threshold - net;
  if (gap <= 0) return null;
  return `ซื้ออีก ฿${gap.toLocaleString("th-TH")} เพื่อจัดส่งฟรี`;
}

function resolveShippingParams(
  _category: string,
  _rules: ShippingRule[] | null | undefined,
): { threshold: number; fee: number } {
  return {
    threshold: QUOTATION_SHIPPING_FREE_THRESHOLD,
    fee: QUOTATION_SHIPPING_COST,
  };
}

/** Storefront shipping from env-backed thresholds via `shippingFeeForSubtotal`. */
export function calculateShipping(
  category: string,
  netAmountBeforeShipping: number,
  rules: ShippingRule[] | null | undefined,
): number {
  const { threshold, fee } = resolveShippingParams(category, rules);
  return shippingFeeForSubtotal(netAmountBeforeShipping, threshold, fee);
}

export function evaluateFreeGifts(
  cartItems: CartItem[],
  promotions: Promotion[],
  paymentMethod?: string,
  brandPromotionRules: BrandPromotionRuleRow[] = [],
): Promotion[] {
  const subtotal = cartItems
    .filter((i) => !i.isFreeGift)
    .reduce((sum, i) => {
      const { unit } = unitBahtAfterBrandForCartItem(i.price, i.breederName, brandPromotionRules);
      return sum + unit * i.quantity;
    }, 0);

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

/** Unit after list price + optional brand % (whole Baht). */
export function unitBahtAfterBrandForCartItem(
  baseUnitBaht: number,
  breederName: string | null | undefined,
  brandRules: BrandPromotionRuleRow[],
): { unit: number; brandApplied: boolean } {
  const rounded = roundCheckoutBahtWhole(baseUnitBaht);
  if (brandRules.length === 0) {
    return { unit: rounded, brandApplied: false };
  }
  const rule = matchBrandPromotionRule(brandRules, breederName);
  if (!rule || rule.discount_percent <= 0) {
    return { unit: rounded, brandApplied: false };
  }
  return {
    unit: applyBrandPercentToUnitBaht(baseUnitBaht, rule.discount_percent),
    brandApplied: true,
  };
}

/**
 * Storefront cart: brand % per line → subtotal → coupon on subtotal → shipping on net → total.
 * GrandTotal = round(netAfterCoupon + shipping) where netAfterCoupon = round(subtotalAfterBrand − couponDiscount).
 */
export function calculateCartSummary(
  items: CartItem[],
  shippingRules: ShippingRule[],
  primaryCategory: string = STOREFRONT_SHIPPING_CATEGORY,
  promoInfo?: PromoInfo | null,
  brandPromotionRules: BrandPromotionRuleRow[] = [],
): CartSummary {
  const brandRules = brandPromotionRules;

  const subtotalSatang = items
    .filter((i) => !i.isFreeGift)
    .reduce((sum, i) => {
      const { unit } = unitBahtAfterBrandForCartItem(i.price, i.breederName, brandRules);
      return sum + bahtToSatangInt(unit * i.quantity);
    }, 0);
  const subtotal = roundCheckoutBahtWhole(satangIntToBaht(subtotalSatang));

  const couponDiscount = promoInfo
    ? roundCheckoutBahtWhole(computeCouponDiscountBahtOnSubtotal(subtotal, promoInfo))
    : 0;

  const netAmountBeforeShipping = Math.max(
    0,
    roundCheckoutBahtWhole(
      satangIntToBaht(bahtToSatangInt(subtotal) - bahtToSatangInt(couponDiscount)),
    ),
  );
  const shipping = roundCheckoutBahtWhole(
    calculateShipping(primaryCategory, netAmountBeforeShipping, shippingRules),
  );
  const total = roundCheckoutBahtWhole(
    satangIntToBaht(
      bahtToSatangInt(netAmountBeforeShipping) + bahtToSatangInt(shipping),
    ),
  );

  const discountPercent =
    promoInfo && isCouponPercentageType(promoInfo.discount_type)
      ? Number(promoInfo.discount_value) || 0
      : 0;

  return {
    subtotal,
    discount: couponDiscount,
    discountPercent,
    tierDiscount: 0,
    promoDiscount: couponDiscount,
    shipping,
    total,
    appliedTier: null,
    upsellMessage: generateUpsellMessage(netAmountBeforeShipping),
    usePromoForOrder: couponDiscount > 0,
    promoSupersededByTier: false,
  };
}
