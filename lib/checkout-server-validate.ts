import { prisma } from "@/lib/prisma";
import { calculateCartSummary, evaluateFreeGifts, type TieredDiscountRule } from "@/lib/cart-utils";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";
import { getActiveTieredDiscountRules } from "@/lib/active-tiered-discount-rules";
import type { CartItem, DiscountTier, Promotion, ShippingRule } from "@/types/supabase";
import type { CheckoutItem, CheckoutSummary } from "@/lib/services/order-service";

type LineIn = {
  variantId: number;
  quantity: number;
  price: number;
  isFreeGift?: boolean;
  productName: string;
};

function sortGiftTuples(rows: { variantId: number; quantity: number }[]): string {
  return JSON.stringify(
    [...rows].sort((a, b) => a.variantId - b.variantId || a.quantity - b.quantity)
  );
}

function near(a: number, b: number, eps = 0.02): boolean {
  return Math.abs(a - b) <= eps;
}

/**
 * Recomputes cart totals from DB prices + rules and rejects tampered payloads.
 * Call before createOrder; use returned items/summary for persistence.
 */
export async function validateStorefrontCheckoutTotals(input: {
  items: LineIn[];
  summary: CheckoutSummary;
  promo_code_id: number | null;
}): Promise<
  | { ok: true; resolvedItems: CheckoutItem[]; resolvedSummary: CheckoutSummary }
  | { ok: false; error: string }
> {
  const { items: lines, summary: clientSummary, promo_code_id } = input;

  const variantIds = [...new Set(lines.map((l) => l.variantId))].map((id) => BigInt(id));

  const [
    variants,
    discountTierRows,
    shippingRows,
    promotionRows,
    tieredRules,
    promoRow,
  ] = await Promise.all([
    prisma.product_variants.findMany({
      where: { id: { in: variantIds }, is_active: true },
      include: { products: { select: { name: true } } },
    }),
    prisma.discount_tiers.findMany({ where: { is_active: true }, orderBy: { min_amount: "asc" } }),
    prisma.shipping_rules.findMany({ where: { is_active: true } }),
    prisma.promotions.findMany({ where: { is_active: true } }),
    getActiveTieredDiscountRules(),
    promo_code_id != null
      ? prisma.promo_codes.findFirst({
          where: { id: BigInt(promo_code_id), is_active: true },
        })
      : Promise.resolve(null),
  ]);

  const vmap = new Map<number, (typeof variants)[0]>();
  for (const v of variants) {
    vmap.set(Number(v.id), v);
  }

  for (const line of lines) {
    if (!vmap.has(line.variantId)) {
      return { ok: false, error: "สินค้าบางรายการไม่พร้อมจำหน่าย" };
    }
  }

  if (promo_code_id != null && !promoRow) {
    return { ok: false, error: "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ" };
  }

  const paidLines = lines.filter((l) => !l.isFreeGift);
  const giftLines = lines.filter((l) => l.isFreeGift);

  const paidCartItems: CartItem[] = paidLines.map((line) => {
    const v = vmap.get(line.variantId)!;
    const unit = Number(v.price);
    return {
      variantId: line.variantId,
      productId: v.product_id != null ? Number(v.product_id) : 0,
      productName: v.products?.name ?? line.productName,
      productImage: null,
      unitLabel: v.unit_label,
      price: unit,
      quantity: line.quantity,
      isFreeGift: false,
    };
  });

  const paidSubtotal = paidCartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  if (promoRow) {
    const minSpend = promoRow.min_spend != null ? Number(promoRow.min_spend) : 0;
    if (minSpend > 0 && paidSubtotal + 1e-9 < minSpend) {
      return { ok: false, error: "ยอดสั่งซื้อไม่ถึงขั้นต่ำสำหรับโค้ดนี้" };
    }
  }

  const promotions: Promotion[] = promotionRows.map((p) => ({
    id: Number(p.id),
    name: p.name,
    condition_type: p.condition_type ?? "",
    condition_value: p.condition_value ?? "",
    reward_variant_id: p.reward_variant_id != null ? Number(p.reward_variant_id) : null,
    reward_quantity: p.reward_quantity ?? 1,
    is_active: p.is_active ?? false,
  }));

  const expectedGifts = evaluateFreeGifts(paidCartItems, promotions, "TRANSFER")
    .filter((p) => p.reward_variant_id != null)
    .map((p) => ({
      variantId: Number(p.reward_variant_id),
      quantity: p.reward_quantity ?? 1,
    }));

  if (sortGiftTuples(expectedGifts) !== sortGiftTuples(giftLines.map((g) => ({
    variantId: g.variantId,
    quantity: g.quantity,
  })))) {
    return { ok: false, error: "ของแถมในตะกร้าไม่ตรงกับโปรโมชัน" };
  }

  const tiers: DiscountTier[] = discountTierRows.map((t) => ({
    id: Number(t.id),
    min_amount: Number(t.min_amount),
    discount_percentage: Number(t.discount_percentage),
    is_active: t.is_active ?? true,
  }));

  const shippingRules: ShippingRule[] = shippingRows.map((r) => ({
    id: Number(r.id),
    category_name: r.category_name,
    base_fee: Number(r.base_fee ?? 0),
    free_shipping_threshold: Number(r.free_shipping_threshold ?? 0),
  }));

  const tiered: TieredDiscountRule[] = tieredRules;

  const promoInfo =
    promoRow && promo_code_id != null
      ? {
          discount_type: String(promoRow.discount_type ?? "PERCENTAGE"),
          discount_value: Number(promoRow.discount_value ?? 0),
        }
      : null;

  const fullCart: CartItem[] = [
    ...paidCartItems,
    ...giftLines.map((line) => {
      const v = vmap.get(line.variantId)!;
      return {
        variantId: line.variantId,
        productId: v.product_id != null ? Number(v.product_id) : 0,
        productName: v.products?.name ?? line.productName,
        productImage: null,
        unitLabel: v.unit_label,
        price: 0,
        quantity: line.quantity,
        isFreeGift: true,
      };
    }),
  ];

  const serverSummary = calculateCartSummary(
    fullCart,
    tiers,
    shippingRules,
    STOREFRONT_SHIPPING_CATEGORY,
    0,
    tiered,
    promoInfo
  );

  if (
    !near(clientSummary.subtotal, serverSummary.subtotal) ||
    !near(clientSummary.discount, serverSummary.discount) ||
    !near(clientSummary.shipping, serverSummary.shipping) ||
    !near(clientSummary.total, serverSummary.total)
  ) {
    console.warn("[checkout-server-validate] totals mismatch", {
      client: clientSummary,
      server: {
        subtotal: serverSummary.subtotal,
        discount: serverSummary.discount,
        shipping: serverSummary.shipping,
        total: serverSummary.total,
      },
    });
    return { ok: false, error: "ยอดเงินไม่ตรงกับระบบ กรุณารีเฟรชหน้าแล้วลองใหม่" };
  }

  const resolvedItems: CheckoutItem[] = lines.map((line) => {
    const v = vmap.get(line.variantId)!;
    const gift = line.isFreeGift === true;
    return {
      variantId: line.variantId,
      quantity: line.quantity,
      price: gift ? 0 : Number(v.price),
      productName: line.productName,
      isFreeGift: gift,
    };
  });

  return {
    ok: true,
    resolvedItems,
    resolvedSummary: {
      subtotal: serverSummary.subtotal,
      discount: serverSummary.discount,
      shipping: serverSummary.shipping,
      total: serverSummary.total,
    },
  };
}
