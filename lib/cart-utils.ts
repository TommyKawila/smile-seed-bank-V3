import type { CartItem, CartSummary, DiscountTier, ShippingRule, Promotion } from "@/types/supabase";
import {
  QUOTATION_SHIPPING_COST,
  QUOTATION_SHIPPING_FREE_THRESHOLD,
  shippingFeeForSubtotal,
} from "@/lib/order-financials";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";

export interface TieredDiscountRule {
  min_spend: number;
  discount_percent: number;
}

/** Evaluate best tier by subtotal (total spend). */
export function evaluateTieredDiscountBySpend(
  subtotal: number,
  rules: TieredDiscountRule[]
): { discountPercent: number; minSpend: number } | null {
  const eligible = rules.filter((r) => subtotal >= r.min_spend);
  if (eligible.length === 0) return null;
  const best = eligible.reduce((a, b) =>
    b.discount_percent > a.discount_percent ? b : a
  );
  return { discountPercent: best.discount_percent, minSpend: best.min_spend };
}

export function evaluateDiscountTier(subtotal: number, tiers: DiscountTier[]): DiscountTier | null {
  const eligible = tiers.filter((t) => t.is_active && subtotal >= t.min_amount);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, t) =>
    t.discount_percentage > best.discount_percentage ? t : best
  );
}

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
  return `ซื้ออีก ฿${gap.toLocaleString("th-TH")} เพื่อรับส่วนลด ${nextTier.discount_percentage}%`;
}

function resolveShippingParams(
  category: string,
  rules: ShippingRule[] | null | undefined
): { threshold: number; fee: number } {
  const list = Array.isArray(rules) ? rules : [];
  const rule = list.find(
    (r) => String(r.category_name ?? "").toLowerCase() === category.toLowerCase()
  );
  if (!rule) {
    return {
      threshold: QUOTATION_SHIPPING_FREE_THRESHOLD,
      fee: QUOTATION_SHIPPING_COST,
    };
  }
  const th = Number(rule.free_shipping_threshold);
  const fee = Number(rule.base_fee);
  const ok =
    Number.isFinite(th) &&
    Number.isFinite(fee) &&
    th >= 0 &&
    fee >= 0;
  if (!ok) {
    return {
      threshold: QUOTATION_SHIPPING_FREE_THRESHOLD,
      fee: QUOTATION_SHIPPING_COST,
    };
  }
  return { threshold: th, fee };
}

/** Uses `shipping_rules` when present and valid; otherwise `order-financials` defaults. */
export function calculateShipping(
  category: string,
  subtotal: number,
  rules: ShippingRule[] | null | undefined
): number {
  const { threshold, fee } = resolveShippingParams(category, rules);
  return shippingFeeForSubtotal(subtotal, threshold, fee);
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

export interface PromoInfo {
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number;
}

export function calculateCartSummary(
  items: CartItem[],
  tiers: DiscountTier[],
  shippingRules: ShippingRule[],
  primaryCategory: string = STOREFRONT_SHIPPING_CATEGORY,
  promoDiscount: number = 0,
  tieredRules?: TieredDiscountRule[],
  promoInfo?: PromoInfo | null
): CartSummary {
  const subtotal = items
    .filter((i) => !i.isFreeGift)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const tieredResult = tieredRules?.length
    ? evaluateTieredDiscountBySpend(subtotal, tieredRules)
    : null;
  const appliedTier = evaluateDiscountTier(subtotal, tiers);
  const tierPercent = Math.max(
    tieredResult?.discountPercent ?? 0,
    appliedTier?.discount_percentage ?? 0
  );

  const tierDiscount = Math.round(subtotal * (tierPercent / 100));
  const amountAfterTier = subtotal - tierDiscount;
  const isPercentage = promoInfo && String(promoInfo.discount_type).toUpperCase() === "PERCENTAGE";
  const isFixed = promoInfo && String(promoInfo.discount_type).toUpperCase() === "FIXED";
  const promoDiscountAmount = isPercentage
    ? Math.round(amountAfterTier * (promoInfo!.discount_value / 100))
    : isFixed
      ? Math.min(promoInfo!.discount_value, amountAfterTier)
      : promoDiscount;
  const total = subtotal - tierDiscount - promoDiscountAmount;
  const shipping = calculateShipping(primaryCategory, total, shippingRules);

  return {
    subtotal,
    discount: tierDiscount + promoDiscountAmount,
    discountPercent: tierPercent,
    tierDiscount,
    promoDiscount: promoDiscountAmount,
    shipping,
    total: total + shipping,
    appliedTier: appliedTier ?? null,
    upsellMessage: generateUpsellMessage(subtotal, tiers, tieredRules),
  };
}
