import { createClient } from "@/lib/supabase/server";
import {
  evaluateDiscountTier,
  generateUpsellMessage,
  calculateShipping,
  evaluateFreeGifts,
  calculateCartSummary,
} from "@/lib/cart-utils";
import type { CartItem, CartSummary, DiscountTier, ShippingRule, Promotion, PromoCode } from "@/types/supabase";

export { evaluateDiscountTier, generateUpsellMessage, calculateShipping, evaluateFreeGifts, calculateCartSummary };

type ServiceResult<T> = { data: T | null; error: string | null };

// ─── DB Fetchers (server-side only) ───────────────────────────────────────────

export async function fetchDiscountTiers(): Promise<DiscountTier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discount_tiers")
    .select("*")
    .eq("is_active", true)
    .order("min_amount", { ascending: true });
  return (data as DiscountTier[]) ?? [];
}

export async function fetchShippingRules(): Promise<ShippingRule[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("shipping_rules").select("*");
  return (data as ShippingRule[]) ?? [];
}

export async function fetchActivePromotions(): Promise<Promotion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true);
  return (data as Promotion[]) ?? [];
}

// ─── Promo Code Validation (server-side) ──────────────────────────────────────

export async function validatePromoCode(
  code: string,
  subtotal: number,
  customerEmail?: string | null,
  customerPhone?: string | null
): Promise<ServiceResult<{ promoCode: PromoCode; discountAmount: number }>> {
  try {
    const supabase = await createClient();

    const { data: promoData, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (promoError || !promoData) {
      return { data: null, error: "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุแล้ว" };
    }

    const promoCode = promoData as PromoCode;

    if (promoCode.min_spend && subtotal < promoCode.min_spend) {
      return {
        data: null,
        error: `ต้องซื้อขั้นต่ำ ฿${promoCode.min_spend.toLocaleString("th-TH")} เพื่อใช้โค้ดนี้`,
      };
    }

    if (customerEmail || customerPhone) {
      let usageQuery = supabase
        .from("promo_code_usages")
        .select("id")
        .eq("promo_code_id", promoCode.id);

      if (customerEmail && customerPhone) {
        usageQuery = usageQuery.or(
          `customer_email.eq.${customerEmail},customer_phone.eq.${customerPhone}`
        );
      } else if (customerEmail) {
        usageQuery = usageQuery.eq("customer_email", customerEmail);
      } else if (customerPhone) {
        usageQuery = usageQuery.eq("customer_phone", customerPhone);
      }

      const { data: usages } = await usageQuery;
      if (usages && usages.length > 0) {
        return { data: null, error: "โค้ดนี้ถูกใช้งานแล้วในบัญชีของคุณ" };
      }
    }

    const discountAmount =
      promoCode.discount_type === "PERCENTAGE"
        ? Math.round((subtotal * promoCode.discount_value) / 100)
        : promoCode.discount_value;

    return { data: { promoCode, discountAmount }, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Re-export types used by consumers ────────────────────────────────────────
export type { CartItem, CartSummary };
