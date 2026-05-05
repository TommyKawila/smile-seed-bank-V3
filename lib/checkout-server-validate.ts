import { prisma } from "@/lib/prisma";
import { calculateCartSummary, evaluateFreeGifts, type TieredDiscountRule } from "@/lib/cart-utils";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";
import { getActiveTieredDiscountRules } from "@/lib/active-tiered-discount-rules";
import type { CartItem, DiscountTier, Promotion, ShippingRule } from "@/types/supabase";
import {
  bahtToSatangInt,
  quantizeBaht2,
  sameBahtSatang,
  satangIntToBaht,
} from "@/lib/money-thb";
import type { CheckoutItem, CheckoutSummary } from "@/lib/services/order-service";

type LineIn = {
  variantId: number;
  quantity: number;
  price: number;
  isFreeGift?: boolean;
  productName: string;
};

function normalizeCheckoutVariantId(v: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

/** Collapse duplicate API lines; never merge paid with gift (`variant+g`/`variant+p`). Keys use canonical string variant id to avoid coercion collisions (e.g. duplicate rows on Vercel). */
function mergeCheckoutDuplicateLines(rows: LineIn[]): LineIn[] {
  const m = new Map<string, LineIn>();
  for (const row of rows) {
    const vidNum = normalizeCheckoutVariantId(row.variantId);
    const bucket = row.isFreeGift === true ? "gift" : "paid";
    const key = `${String(vidNum)}:${bucket}`;
    const prev = m.get(key);
    if (!prev) {
      m.set(key, { ...row, variantId: vidNum });
      continue;
    }
    m.set(key, {
      ...prev,
      variantId: vidNum,
      quantity: prev.quantity + row.quantity,
      productName: prev.productName || row.productName,
    });
  }
  return [...m.values()];
}

/** Last-line defense: one paid row per variant before any sum — Map keys canonical string IDs. */
function collapsePaidCartItemsByVariant(items: CartItem[]): CartItem[] {
  const m = new Map<string, CartItem>();
  for (const i of items) {
    if (i.isFreeGift) continue;
    const vidNum = normalizeCheckoutVariantId(i.variantId);
    if (!Number.isFinite(vidNum) || vidNum < 1) continue;
    const key = String(vidNum);
    const prev = m.get(key);
    if (!prev) {
      m.set(key, { ...i, variantId: vidNum });
      continue;
    }
    m.set(key, {
      ...prev,
      variantId: vidNum,
      quantity: prev.quantity + i.quantity,
      productName: prev.productName || i.productName,
    });
  }
  return [...m.values()];
}

/** Grand total = subtotal − discount + shipping (integer satang, then BAHT). */
function grandTotalFromSummaryParts(summary: Pick<CheckoutSummary, "subtotal" | "discount" | "shipping">): number {
  const satang =
    bahtToSatangInt(summary.subtotal) -
    bahtToSatangInt(summary.discount) +
    bahtToSatangInt(summary.shipping);
  return quantizeBaht2(satangIntToBaht(satang));
}

function sortGiftTuples(rows: { variantId: number; quantity: number }[]): string {
  return JSON.stringify(
    [...rows].sort((a, b) => a.variantId - b.variantId || a.quantity - b.quantity)
  );
}

function checkoutTotalsMismatchLine(client: CheckoutSummary, server: CheckoutSummary): string {
  const cs = client;
  const ss = server;
  const c = (label: string, a: number, b: number) =>
    `${label} client ${quantizeBaht2(a)} vs server ${quantizeBaht2(b)} (${bahtToSatangInt(a) - bahtToSatangInt(b)} satang)`;
  const parts: string[] = [];
  if (!sameBahtSatang(cs.subtotal, ss.subtotal)) parts.push(c("Subtotal", cs.subtotal, ss.subtotal));
  if (!sameBahtSatang(cs.discount, ss.discount)) parts.push(c("Discount", cs.discount, ss.discount));
  if (!sameBahtSatang(cs.shipping, ss.shipping))
    parts.push(c("ShippingFee", cs.shipping, ss.shipping) + " — free-ship threshold vs subtotal-after-discount?");
  if (!sameBahtSatang(cs.total, ss.total)) parts.push(c("GrandTotal", cs.total, ss.total));
  return parts.length ? parts.join(" | ") : "unknown field";
}

function snapSummary(summary: CheckoutSummary): CheckoutSummary {
  return {
    subtotal: quantizeBaht2(summary.subtotal),
    discount: quantizeBaht2(summary.discount),
    shipping: quantizeBaht2(summary.shipping),
    total: quantizeBaht2(summary.total),
  };
}

/**
 * Recomputes cart totals from DB prices + rules and rejects tampered payloads.
 * Call before createOrder; use returned items/summary for persistence.
 */
export async function validateStorefrontCheckoutTotals(input: {
  items: LineIn[];
  summary: CheckoutSummary;
  promo_code_id: number | null;
  /** Order placement: strict totals match. PromptPay QR: server totals authoritative; client floats ignored. */
  purpose?: "order_create" | "prompt_pay_preview";
}): Promise<
  | { ok: true; resolvedItems: CheckoutItem[]; resolvedSummary: CheckoutSummary }
  | { ok: false; error: string }
> {
  const { items: rawLines, summary: clientSummary, promo_code_id, purpose = "order_create" } = input;

  for (const row of rawLines) {
    const v = normalizeCheckoutVariantId(row.variantId);
    if (!Number.isFinite(v) || v < 1) {
      return { ok: false, error: "สินค้าบางรายการไม่ถูกต้อง" };
    }
  }

  const mergedLines = mergeCheckoutDuplicateLines(rawLines);
  console.warn(
    `[checkout-server-validate] DEBUG: Raw items count: ${rawLines.length}, Merged items count: ${mergedLines.length}`,
  );

  console.warn(
    `LOG_GHOST: Raw ID List: [${rawLines
      .map((r) => {
        const v = normalizeCheckoutVariantId(r.variantId);
        return `${String(Number.isFinite(v) ? v : r.variantId)}:${r.isFreeGift === true ? "g" : "p"}:${r.quantity}`;
      })
      .join(",")}]`,
  );
  console.warn(
    `LOG_GHOST: Merged ID List: [${mergedLines
      .map((r) => `${String(r.variantId)}:${r.isFreeGift === true ? "g" : "p"}:${r.quantity}`)
      .join(",")}]`,
  );

  /** All maths use mergedLines exclusively from here onward. */
  const variantIds = [...new Set(mergedLines.map((l) => l.variantId))].map((id) => BigInt(id));

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

  for (const line of mergedLines) {
    if (!vmap.has(line.variantId)) {
      return { ok: false, error: "สินค้าบางรายการไม่พร้อมจำหน่าย" };
    }
  }

  if (promo_code_id != null && !promoRow) {
    return { ok: false, error: "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ" };
  }

  const paidLines = mergedLines.filter((l) => l.isFreeGift !== true);
  const giftLines = mergedLines.filter((l) => l.isFreeGift === true);

  const paidCartItemsDraft: CartItem[] = paidLines.map((line) => {
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

  const paidCartItems = collapsePaidCartItemsByVariant(paidCartItemsDraft);
  if (paidCartItemsDraft.length !== paidCartItems.length) {
    console.warn(
      `[checkout-server-validate] Collapsed duplicate paid cart rows: ${paidCartItemsDraft.length} → ${paidCartItems.length}`,
    );
  }

  const paidSubtotal = paidCartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  if (promoRow) {
    const minSpend = promoRow.min_spend != null ? Number(promoRow.min_spend) : 0;
    if (minSpend > 0 && bahtToSatangInt(paidSubtotal) < bahtToSatangInt(minSpend)) {
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

  const serverSummaryRaw = calculateCartSummary(
    fullCart,
    tiers,
    shippingRules,
    STOREFRONT_SHIPPING_CATEGORY,
    0,
    tiered,
    promoInfo
  );

  const canonicalGrand = grandTotalFromSummaryParts(serverSummaryRaw);
  if (!sameBahtSatang(canonicalGrand, serverSummaryRaw.total)) {
    console.warn("[checkout-server-validate] canonical grand ≠ calculateCartSummary.total (using canonical)", {
      canonicalGrand,
      cartUtilsTotal: serverSummaryRaw.total,
      subtotal: serverSummaryRaw.subtotal,
      discount: serverSummaryRaw.discount,
      shipping: serverSummaryRaw.shipping,
    });
  }

  if (!sameBahtSatang(paidSubtotal, serverSummaryRaw.subtotal)) {
    console.warn("[checkout-server-validate] paidSubtotal≠summary.subtotal", {
      paidSubtotal,
      summarySubtotal: serverSummaryRaw.subtotal,
    });
  }

  const serverSummary: CheckoutSummary = {
    subtotal: serverSummaryRaw.subtotal,
    discount: serverSummaryRaw.discount,
    shipping: serverSummaryRaw.shipping,
    total: canonicalGrand,
  };

  const totalsMismatch =
    !sameBahtSatang(clientSummary.subtotal, serverSummary.subtotal) ||
    !sameBahtSatang(clientSummary.discount, serverSummary.discount) ||
    !sameBahtSatang(clientSummary.shipping, serverSummary.shipping) ||
    !sameBahtSatang(clientSummary.total, serverSummary.total);

  if (totalsMismatch) {
    const cs = clientSummary;
    const ss = serverSummary;
    const detail = checkoutTotalsMismatchLine(cs, ss);
    if (purpose === "prompt_pay_preview") {
      console.warn(
        `[checkout-server-validate] PromptPay preview — client/UI totals ignored; QR uses DB rules. ${detail}`,
        {
          diffSatang: {
            subtotal: bahtToSatangInt(cs.subtotal) - bahtToSatangInt(ss.subtotal),
            discount: bahtToSatangInt(cs.discount) - bahtToSatangInt(ss.discount),
            shipping: bahtToSatangInt(cs.shipping) - bahtToSatangInt(ss.shipping),
            total: bahtToSatangInt(cs.total) - bahtToSatangInt(ss.total),
          },
        },
      );
    } else {
      console.warn(
        `[checkout-server-validate] Amount mismatch — ${detail}`,
        {
          narrative: `${detail}`,
          diffSatang: {
            subtotal: bahtToSatangInt(cs.subtotal) - bahtToSatangInt(ss.subtotal),
            discount: bahtToSatangInt(cs.discount) - bahtToSatangInt(ss.discount),
            shipping: bahtToSatangInt(cs.shipping) - bahtToSatangInt(ss.shipping),
            total: bahtToSatangInt(cs.total) - bahtToSatangInt(ss.total),
          },
          clientSatang: {
            subtotal: bahtToSatangInt(cs.subtotal),
            discount: bahtToSatangInt(cs.discount),
            shipping: bahtToSatangInt(cs.shipping),
            total: bahtToSatangInt(cs.total),
          },
          serverSatang: {
            subtotal: bahtToSatangInt(ss.subtotal),
            discount: bahtToSatangInt(ss.discount),
            shipping: bahtToSatangInt(ss.shipping),
            total: bahtToSatangInt(ss.total),
          },
        },
      );
      return { ok: false, error: "ยอดเงินไม่ตรงกับระบบ กรุณารีเฟรชหน้าแล้วลองใหม่" };
    }
  }

  const normalizedForOrder: LineIn[] = [...paidLines, ...giftLines];
  const resolvedItems: CheckoutItem[] = normalizedForOrder.map((line) => {
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
    resolvedSummary: snapSummary(serverSummary),
  };
}
