"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  evaluateDiscountTier,
  generateUpsellMessage,
  evaluateFreeGifts,
  calculateCartSummary,
  type TieredDiscountRule,
} from "@/lib/cart-utils";
import { applyWholesalePrice } from "@/lib/wholesale-utils";
import type {
  CartItem,
  CartSummary,
  DiscountTier,
  ShippingRule,
  Promotion,
  PromoCode,
} from "@/types/supabase";
import {
  STOREFRONT_SHIPPING_CATEGORY,
  SHIPPING_RULES_BROADCAST_CHANNEL,
} from "@/lib/storefront-shipping";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

// Promo code: uppercase alphanumeric, 3–20 chars
const PromoCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, "โค้ดต้องมีอย่างน้อย 3 ตัวอักษร")
  .max(20, "โค้ดต้องไม่เกิน 20 ตัวอักษร")
  .regex(/^[A-Z0-9_-]+$/, "โค้ดต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์ใหญ่หรือตัวเลขเท่านั้น");

const AddToCartSchema = z.object({
  variantId: z.number().positive(),
  productId: z.number().positive(),
  productName: z.string().min(1),
  productImage: z.string().nullable(),
  unitLabel: z.string().min(1),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  quantity: z.number().int().positive("จำนวนต้องมากกว่า 0"),
  stock_quantity: z.number().int().min(0).optional(),
  masterSku: z.string().nullable().optional(),
  breeder_id: z.number().int().positive().nullable().optional(),
  breederLogoUrl: z.string().nullable().optional(),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const CART_STORAGE_KEY = "ssb_cart_v3";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromoState {
  code: PromoCode | null;
  discountAmount: number;
  error: string | null;
}

interface UseCartReturn {
  items: CartItem[];
  summary: CartSummary;
  promo: PromoState;
  tieredDiscountRules: TieredDiscountRule[];
  isLoadingRules: boolean;
  isValidatingPromo: boolean;
  addToCart: (item: Omit<CartItem, "isFreeGift">) => { error: string | null };
  removeFromCart: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => { ok: boolean; maxStock?: number };
  applyPromoCode: (code: string, customerEmail?: string | null, customerPhone?: string | null, customerUserId?: string | null) => Promise<{ success: boolean; requireLogin?: boolean; attemptedCode?: string; message?: string }>;
  clearPromoCode: () => void;
  clearCart: () => void;
  applyWholesaleToItems: (discountPercent: number) => void;
  itemCount: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([]);
  const [tieredDiscountRules, setTieredDiscountRules] = useState<TieredDiscountRule[]>([]);
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  const FALLBACK_TIERED_RULES: TieredDiscountRule[] = [
    { min_spend: 2000, discount_percent: 10 },
    { min_spend: 4000, discount_percent: 15 },
    { min_spend: 6000, discount_percent: 20 },
  ];
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promo, setPromo] = useState<PromoState>({
    code: null,
    discountAmount: 0,
    error: null,
  });

  // ── Restore cart from localStorage on mount ──────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as CartItem[]);
    } catch {
      // Corrupted storage — start fresh
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  // ── Persist cart to localStorage on every change ──────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage might be unavailable (private mode, etc.)
    }
  }, [items]);

  // ── Fetch discount tiers, tiered_discounts, shipping rules on mount ───────
  const refetchShippingRules = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from("shipping_rules").select("*");
      setShippingRules((data as ShippingRule[]) ?? []);
    } catch {
      /* keep prior rules */
    }
  }, []);

  useEffect(() => {
    const loadRules = async () => {
      setIsLoadingRules(true);
      try {
        const supabase = createClient();

        const [tiersRes, shippingRes, promoRes, tieredRes] = await Promise.all([
          supabase
            .from("discount_tiers")
            .select("*")
            .eq("is_active", true)
            .order("min_amount", { ascending: true }),
          supabase.from("shipping_rules").select("*"),
          supabase.from("promotions").select("*").eq("is_active", true),
          fetch("/api/storefront/tiered-discounts").then((r) => r.ok ? r.json() : FALLBACK_TIERED_RULES),
        ]);

        setDiscountTiers((tiersRes.data as DiscountTier[]) ?? []);
        setShippingRules((shippingRes.data as ShippingRule[]) ?? []);
        setPromotions((promoRes.data as Promotion[]) ?? []);

        const tiered = Array.isArray(tieredRes) && tieredRes.length > 0
          ? tieredRes
          : FALLBACK_TIERED_RULES;
        setTieredDiscountRules(tiered);
      } catch {
        setTieredDiscountRules(FALLBACK_TIERED_RULES);
      } finally {
        setIsLoadingRules(false);
      }
    };

    void loadRules();
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(SHIPPING_RULES_BROADCAST_CHANNEL);
    ch.onmessage = () => {
      void refetchShippingRules();
    };
    return () => ch.close();
  }, [refetchShippingRules]);

  // ── Compute cart summary (compound: tier first, then promo on remaining) ───
  const summary = useMemo((): CartSummary => {
    const rules = tieredDiscountRules.length > 0 ? tieredDiscountRules : FALLBACK_TIERED_RULES;
    const promoInfo = promo.code?.discount_type && promo.code?.discount_value
      ? { discount_type: promo.code.discount_type, discount_value: promo.code.discount_value }
      : null;
    return calculateCartSummary(
      items,
      discountTiers,
      shippingRules,
      STOREFRONT_SHIPPING_CATEGORY,
      promo.discountAmount,
      rules,
      promoInfo
    );
  }, [items, discountTiers, tieredDiscountRules, shippingRules, promo.discountAmount, promo.code]);

  // ── Auto-apply free gifts when items change ───────────────────────────────
  useEffect(() => {
    if (promotions.length === 0) return;

    const nonGiftItems = items.filter((i) => !i.isFreeGift);
    const triggeredGifts = evaluateFreeGifts(nonGiftItems, promotions);

    // Remove old free gifts, then add newly triggered ones
    const existingGiftIds = new Set(
      items.filter((i) => i.isFreeGift).map((i) => i.variantId)
    );
    const newGiftIds = new Set(
      triggeredGifts.flatMap((p) =>
        p.reward_variant_id ? [p.reward_variant_id] : []
      )
    );

    const giftIdsChanged =
      existingGiftIds.size !== newGiftIds.size ||
      [...newGiftIds].some((id) => !existingGiftIds.has(id));

    if (!giftIdsChanged) return;

    setItems((prev) => {
      const withoutOldGifts = prev.filter((i) => !i.isFreeGift);
      const newGiftItems: CartItem[] = triggeredGifts
        .filter((p) => p.reward_variant_id)
        .map((p) => ({
          variantId: p.reward_variant_id!,
          productId: 0,
          productName: `🎁 ${p.name}`,
          productImage: null,
          unitLabel: `${p.reward_quantity} ชิ้น`,
          price: 0,
          quantity: p.reward_quantity,
          isFreeGift: true,
        }));
      return [...withoutOldGifts, ...newGiftItems];
    });
  }, [items, promotions]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const addToCart = useCallback(
    (itemData: Omit<CartItem, "isFreeGift">): { error: string | null } => {
      const parsed = AddToCartSchema.safeParse(itemData);
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
      }

      const { variantId, quantity: addQty } = parsed.data;
      const cap = parsed.data.stock_quantity;

      let mergeError: string | null = null;
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.variantId === variantId && !i.isFreeGift
        );
        const maxStock =
          existing?.stock_quantity !== undefined
            ? existing.stock_quantity
            : cap;

        if (existing) {
          const nextQty = existing.quantity + addQty;
          if (maxStock !== undefined && nextQty > maxStock) {
            mergeError = `ขออภัย สินค้าชิ้นนี้มีสต็อกเพียง ${maxStock} ชิ้นเท่านั้น`;
            return prev;
          }
          return prev.map((i) =>
            i.variantId === variantId && !i.isFreeGift
              ? {
                  ...i,
                  quantity: nextQty,
                  stock_quantity:
                    maxStock !== undefined ? maxStock : i.stock_quantity,
                }
              : i
          );
        }

        if (cap !== undefined && addQty > cap) {
          mergeError = `ขออภัย สินค้าชิ้นนี้มีสต็อกเพียง ${cap} ชิ้นเท่านั้น`;
          return prev;
        }

        return [...prev, { ...parsed.data, isFreeGift: false }];
      });

      return { error: mergeError };
    },
    []
  );

  const removeFromCart = useCallback((variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback(
    (variantId: number, quantity: number): { ok: boolean; maxStock?: number } => {
      const out: { ok: boolean; maxStock?: number } = { ok: true };
      setItems((prev) => {
        const item = prev.find(
          (i) => i.variantId === variantId && !i.isFreeGift
        );
        if (!item) {
          out.ok = false;
          return prev;
        }

        if (quantity <= 0) {
          return prev.filter((i) => i.variantId !== variantId);
        }

        const max = item.stock_quantity;
        if (max !== undefined && quantity > max) {
          out.ok = false;
          out.maxStock = max;
          return prev;
        }

        return prev.map((i) =>
          i.variantId === variantId && !i.isFreeGift ? { ...i, quantity } : i
        );
      });
      return out;
    },
    []
  );

  // ── Apply Promo Code — calls validate API (coupon_redemptions + usage_limit) ─
  const applyPromoCode = useCallback(
    async (
      code: string,
      customerEmail?: string | null,
      customerPhone?: string | null,
      customerUserId?: string | null
    ): Promise<{ success: boolean; requireLogin?: boolean; attemptedCode?: string; message?: string }> => {
      setPromo({ code: null, discountAmount: 0, error: null });
      setIsValidatingPromo(true);

      const parsed = PromoCodeSchema.safeParse(code);
      if (!parsed.success) {
        setPromo({
          code: null,
          discountAmount: 0,
          error: parsed.error.issues[0]?.message ?? "รูปแบบโค้ดไม่ถูกต้อง",
        });
        setIsValidatingPromo(false);
        return { success: false };
      }

      const subtotal = items
        .filter((i) => !i.isFreeGift)
        .reduce((s, i) => s + i.price * i.quantity, 0);

      try {
        const res = await fetch("/api/storefront/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: parsed.data,
            subtotal,
            email: customerEmail || null,
            phone: customerPhone || null,
            user_id: customerUserId || null,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg =
            data?.error === "Used"
              ? "คุณเคยใช้โค้ดนี้แล้ว"
              : data?.error === "Please login to use this code"
                ? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ดนี้"
                : data?.error === "This code is for new customers only"
                  ? "โค้ดนี้สำหรับลูกค้าใหม่เท่านั้น"
                  : (data?.error ?? "ไม่สามารถใช้โค้ดได้");
          setPromo({ code: null, discountAmount: 0, error: data?.requireLogin ? null : errMsg });
          if (res.status === 401 && data?.requireLogin) {
            return { success: false, requireLogin: true, attemptedCode: parsed.data, message: data?.error };
          }
          return { success: false };
        }

        setPromo({
          code: { id: data.promo_code_id, code: data.code, discount_type: data.discount_type, discount_value: data.discount_value, min_spend: null, is_active: true },
          discountAmount: data.discount_amount,
          error: null,
        });
        return { success: true };
      } catch (err) {
        setPromo({ code: null, discountAmount: 0, error: String(err) });
        return { success: false };
      } finally {
        setIsValidatingPromo(false);
      }
    },
    [items]
  );

  const clearPromoCode = useCallback(() => {
    setPromo({ code: null, discountAmount: 0, error: null });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromo({ code: null, discountAmount: 0, error: null });
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // ── Apply wholesale pricing to all non-gift items ─────────────────────────
  const applyWholesaleToItems = useCallback((discountPercent: number) => {
    if (discountPercent <= 0) return;
    setItems((prev) =>
      prev.map((item) =>
        item.isFreeGift
          ? item
          : { ...item, price: applyWholesalePrice(item.price, discountPercent) }
      )
    );
  }, []);

  const itemCount = useMemo(
    () => items.filter((i) => !i.isFreeGift).reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  return {
    items,
    summary,
    promo,
    tieredDiscountRules,
    isLoadingRules,
    isValidatingPromo,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromoCode,
    clearPromoCode,
    clearCart,
    applyWholesaleToItems,
    itemCount,
  };
}

// ─── Re-export pure helpers (import cart-utils directly for calculateShipping) ─
export { evaluateDiscountTier, generateUpsellMessage };
