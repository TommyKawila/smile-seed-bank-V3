import type { CartItem } from "@/types/supabase";

export type PromotionRuleType = "DISCOUNT" | "BUY_X_GET_Y" | "FREEBIES" | "BUNDLE";

export interface PromotionRule {
  id: number;
  name: string;
  type: PromotionRuleType;
  description?: string | null;
  conditions?: Record<string, unknown> | null;
  discount_value?: number | null;
}

export interface PromotionResult {
  promotionDiscount: number;
  activePromotion: PromotionRule | null;
  buyXGetYAlert: { name: string; getQty: number } | null;
  freebieAlert: { name: string; description: string } | null;
}

function getNum(c: Record<string, unknown> | null | undefined, key: string): number {
  if (!c) return 0;
  const v = c[key];
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

export function applyPromotions(
  cartItems: CartItem[],
  promotions: PromotionRule[],
  productIdToBreeder?: Map<number, number>
): PromotionResult {
  const paidItems = cartItems.filter((i) => !i.isFreeGift);
  const subtotal = paidItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const getBreederId = (item: CartItem): number =>
    item.breeder_id ?? (productIdToBreeder?.get(item.productId) ?? 0);

  let promotionDiscount = 0;
  let activePromotion: PromotionRule | null = null;
  let buyXGetYAlert: { name: string; getQty: number } | null = null;
  let freebieAlert: { name: string; description: string } | null = null;

  for (const p of promotions) {
    const cond = (p.conditions ?? {}) as Record<string, unknown>;
    const minSpend = getNum(cond, "min_spend");
    const targetBreederId = getNum(cond, "target_breeder_id");
    const buyQty = getNum(cond, "buy_qty");
    const getQty = getNum(cond, "get_qty");

    if (p.type === "DISCOUNT" && minSpend > 0 && subtotal >= minSpend) {
      const dv = typeof p.discount_value === "number" ? p.discount_value : Number(p.discount_value ?? 0);
      const discountType = String((cond as { discount_type?: string }).discount_type ?? "FIXED").toUpperCase();
      const amount = discountType === "PERCENTAGE"
        ? Math.round(subtotal * (dv / 100))
        : dv;
      if (amount > promotionDiscount) {
        promotionDiscount = amount;
        activePromotion = p;
      }
    }

    if (p.type === "BUY_X_GET_Y" && targetBreederId > 0 && buyQty > 0 && getQty > 0) {
      const breederQty = paidItems
        .filter((i) => getBreederId(i) === targetBreederId)
        .reduce((s, i) => s + i.quantity, 0);
      const sets = Math.floor(breederQty / buyQty);
      if (sets > 0) {
        buyXGetYAlert = { name: p.name, getQty: sets * getQty };
      }
    }

    if (p.type === "FREEBIES" && minSpend > 0 && subtotal >= minSpend) {
      freebieAlert = {
        name: p.name,
        description: (p.description ?? "").trim() || "ของแถมตามเงื่อนไข",
      };
    }
  }

  return {
    promotionDiscount,
    activePromotion,
    buyXGetYAlert,
    freebieAlert,
  };
}
