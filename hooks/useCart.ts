"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  evaluateFreeGifts,
  calculateCartSummary,
  unitBahtAfterBrandForCartItem,
  activeBrandRulesFromRows,
  type BrandPromotionRuleRow,
} from "@/lib/cart-utils";
import { applyWholesalePrice } from "@/lib/wholesale-utils";
import type {
  CartItem,
  CartSummary,
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
  .min(3, "Promo code must be at least 3 characters")
  .max(20, "Promo code must be at most 20 characters")
  .regex(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, hyphen, or underscore only");

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
  breederName: z.string().nullable().optional(),
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
  isLoadingRules: boolean;
  isValidatingPromo: boolean;
  brandPromotionRules: BrandPromotionRuleRow[];
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
  const [brandPromotionRules, setBrandPromotionRules] = useState<BrandPromotionRuleRow[]>([]);
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

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

  // ── Fetch shipping rules, promotions, brand promotions on mount ───────────
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

        const [shippingRes, promoRes, brandRes] = await Promise.all([
          supabase.from("shipping_rules").select("*"),
          supabase.from("promotions").select("*").eq("is_active", true),
          fetch("/api/storefront/brand-promotions", { cache: "no-store" }).then((r) =>
            r.ok ? r.json() : { rules: [] },
          ),
        ]);

        setShippingRules((shippingRes.data as ShippingRule[]) ?? []);
        setPromotions((promoRes.data as Promotion[]) ?? []);

        const br =
          brandRes && typeof brandRes === "object" && "rules" in brandRes
            ? (brandRes as { rules: { brand_name: string; discount_percent: number; is_active: boolean }[] })
                .rules
            : [];
        setBrandPromotionRules(activeBrandRulesFromRows(br ?? []));
      } catch {
        setBrandPromotionRules([]);
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

  // ── Cart summary: brand % + coupon + shipping ─────────────────────────────
  const summary = useMemo((): CartSummary => {
    const promoInfo = promo.code?.discount_type && promo.code?.discount_value != null
      ? { discount_type: promo.code.discount_type, discount_value: promo.code.discount_value }
      : null;
    return calculateCartSummary(
      items,
      shippingRules,
      STOREFRONT_SHIPPING_CATEGORY,
      promoInfo,
      brandPromotionRules,
    );
  }, [items, shippingRules, promo.code, brandPromotionRules]);

  // ── Auto-apply free gifts when items change ───────────────────────────────
  useEffect(() => {
    if (promotions.length === 0) return;

    const nonGiftItems = items.filter((i) => !i.isFreeGift);
    const triggeredGifts = evaluateFreeGifts(nonGiftItems, promotions, "TRANSFER", brandPromotionRules);

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
  }, [items, promotions, brandPromotionRules]);

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
      const trimmedIn = (code ?? "").trim();
      if (trimmedIn === "") {
        setPromo((prev) =>
          prev.code != null ? prev : { code: null, discountAmount: 0, error: null }
        );
        return { success: false };
      }

      setPromo({ code: null, discountAmount: 0, error: null });
      setIsValidatingPromo(true);

      const parsed = PromoCodeSchema.safeParse(trimmedIn);
      if (!parsed.success) {
        setPromo({
          code: null,
          discountAmount: 0,
          error: parsed.error.issues[0]?.message ?? "Invalid promo code format",
        });
        setIsValidatingPromo(false);
        return { success: false };
      }

      if (!customerUserId?.trim()) {
        setPromo({ code: null, discountAmount: 0, error: null });
        setIsValidatingPromo(false);
        return {
          success: false,
          requireLogin: true,
          attemptedCode: parsed.data,
          message:
            "Sign up or log in to use promo codes (Google, Email, or LINE)",
        };
      }

      const subtotal = items
        .filter((i) => !i.isFreeGift)
        .reduce((s, i) => {
          const { unit } = unitBahtAfterBrandForCartItem(i.price, i.breederName, brandPromotionRules);
          return s + unit * i.quantity;
        }, 0);

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
          const raw = typeof data?.error === "string" ? data.error : "";
          const errMsg =
            raw === "Used"
              ? "This promo code has already been used"
              : raw === "Please login to use this code"
                ? "Please sign in to use this promo code"
                : raw === "This code is for new customers only"
                  ? "This promo code is for new customers only"
                  : raw || "Unable to apply this promo code";
          setPromo({ code: null, discountAmount: 0, error: data?.requireLogin ? null : errMsg });
          if (res.status === 401 && data?.requireLogin) {
            return { success: false, requireLogin: true, attemptedCode: parsed.data, message: data?.error };
          }
          return { success: false };
        }

        const rawPid = data.promo_code_id as unknown;
        const pid =
          typeof rawPid === "number" && Number.isFinite(rawPid)
            ? rawPid
            : typeof rawPid === "string"
              ? Number(rawPid)
              : Number(rawPid);
        if (!Number.isFinite(pid) || pid <= 0) {
          setPromo({
            code: null,
            discountAmount: 0,
            error: "Could not attach this promo — try again or continue without a code.",
          });
          return { success: false };
        }

        setPromo({
          code: {
            id: pid,
            code: String(data.code ?? ""),
            discount_type: data.discount_type,
            discount_value: Number(data.discount_value),
            min_spend: null,
            is_active: true,
          },
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
    [items, brandPromotionRules]
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
    isLoadingRules,
    isValidatingPromo,
    brandPromotionRules,
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
