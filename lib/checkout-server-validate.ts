import { prisma } from "@/lib/prisma";
import { evaluateFreeGifts, type TieredDiscountRule } from "@/lib/cart-utils";
import { getActiveTieredDiscountRules } from "@/lib/active-tiered-discount-rules";
import type { CartItem, DiscountTier, Promotion } from "@/types/supabase";
import { resolveExclusiveCartDiscounts, type PromoInfo } from "@/lib/discount-utils";
import { bahtToSatangInt, roundCheckoutBahtWhole, satangIntToBaht } from "@/lib/money-thb";
import { shippingFeeForSubtotal } from "@/lib/order-financials";
import type { CheckoutItem, CheckoutSummary } from "@/lib/services/order-service";

type LineIn = {
  variantId: number;
  quantity: number;
  price: number;
  isFreeGift?: boolean;
  productName: string;
};

export type CheckoutValidationFailureDetails = {
  clientValues: CheckoutSummary;
  serverValues: CheckoutSummary;
  dbPrices: {
    variantId: number;
    productId: number;
    unitBaht: number;
    source: "variant" | "product_fallback";
  }[];
};

function normalizeCheckoutVariantId(v: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

type VariantRow = {
  id: bigint;
  product_id: bigint | null;
  unit_label: string;
  price: unknown;
  products: { id: bigint; name: string; price: unknown } | null;
};

/** Prisma Decimal / string / number → finite THB or NaN. */
function coerceDbPriceBaht(raw: unknown): number {
  if (raw == null) return NaN;
  if (typeof raw === "object" && raw !== null && typeof (raw as { toString?: () => string }).toString === "function") {
    const n = Number((raw as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : NaN;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Net unit price for checkout: `product_variants.price` is the final selling price per package
 * (e.g. 2-seed line). Use it first; `products.price` is legacy / base fallback only when variant is missing or ≤ 0.
 */
function resolveListingUnitBaht(v: VariantRow): {
  unitBaht: number;
  source: "variant" | "product_fallback";
} {
  const variantPrice = coerceDbPriceBaht(v.price);
  if (variantPrice > 0) {
    return { unitBaht: roundCheckoutBahtWhole(variantPrice), source: "variant" };
  }
  const rawProduct = coerceDbPriceBaht(v.products?.price);
  const productPrice = rawProduct > 0 ? rawProduct : 0;
  return {
    unitBaht: roundCheckoutBahtWhole(productPrice),
    source: "product_fallback",
  };
}

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

function sortGiftTuples(rows: { variantId: number; quantity: number }[]): string {
  return JSON.stringify(
    [...rows].sort((a, b) => a.variantId - b.variantId || a.quantity - b.quantity),
  );
}

function snapSummary(summary: CheckoutSummary): CheckoutSummary {
  return {
    subtotal: roundCheckoutBahtWhole(summary.subtotal),
    discount: roundCheckoutBahtWhole(summary.discount),
    shipping: roundCheckoutBahtWhole(summary.shipping),
    total: roundCheckoutBahtWhole(summary.total),
  };
}

/**
 * Server-side totals: `product_variants.price` per line (net package price), exclusive discounts,
 * whole-baht net, then shipping from `shippingFeeForSubtotal`.
 */
function buildCheckoutSummaryFromPaidItems(input: {
  paidItems: CartItem[];
  tiers: DiscountTier[];
  tiered: TieredDiscountRule[];
  promoInfo: PromoInfo | null;
}): CheckoutSummary {
  const { paidItems, tiers, tiered, promoInfo } = input;
  const subtotalSatang = paidItems.reduce(
    (s, i) => s + bahtToSatangInt(i.price * i.quantity),
    0,
  );
  const subtotal = roundCheckoutBahtWhole(satangIntToBaht(subtotalSatang));

  const exclusive = resolveExclusiveCartDiscounts({
    subtotal,
    tieredRules: tiered,
    discountTiers: tiers,
    promoInfo,
  });
  const discount = roundCheckoutBahtWhole(
    satangIntToBaht(
      bahtToSatangInt(exclusive.tierDiscount) + bahtToSatangInt(exclusive.promoDiscount),
    ),
  );

  const netBeforeShipping = Math.max(
    0,
    roundCheckoutBahtWhole(
      satangIntToBaht(bahtToSatangInt(subtotal) - bahtToSatangInt(discount)),
    ),
  );
  const shipping = roundCheckoutBahtWhole(shippingFeeForSubtotal(netBeforeShipping));
  const total = roundCheckoutBahtWhole(
    satangIntToBaht(
      bahtToSatangInt(netBeforeShipping) + bahtToSatangInt(shipping),
    ),
  );

  return { subtotal, discount, shipping, total };
}

/**
 * Recomputes cart totals from DB prices + rules and rejects tampered payloads / bad grand totals.
 * Client line `price` is ignored for paid rows; server uses `product_variants.price` (net per package), then `products.price` fallback.
 */
export async function validateStorefrontCheckoutTotals(input: {
  items: LineIn[];
  summary: CheckoutSummary;
  promo_code_id: number | null;
  purpose?: "order_create" | "prompt_pay_preview";
}): Promise<
  | { ok: true; resolvedItems: CheckoutItem[]; resolvedSummary: CheckoutSummary }
  | { ok: false; error: string; details?: CheckoutValidationFailureDetails }
> {
  const { items: rawLines, promo_code_id, purpose = "order_create" } = input;
  const clientSummary = snapSummary(input.summary);

  for (const row of rawLines) {
    const v = normalizeCheckoutVariantId(row.variantId);
    if (!Number.isFinite(v) || v < 1) {
      return { ok: false, error: "สินค้าบางรายการไม่ถูกต้อง" };
    }
  }

  const mergedLines = mergeCheckoutDuplicateLines(rawLines);
  const variantIds = [...new Set(mergedLines.map((l) => l.variantId))].map((id) => BigInt(id));

  const [variants, discountTierRows, promotionRows, tieredRules, promoRow] = await Promise.all([
    prisma.product_variants.findMany({
      where: { id: { in: variantIds }, is_active: true },
      include: { products: { select: { id: true, name: true, price: true } } },
    }),
    prisma.discount_tiers.findMany({ where: { is_active: true }, orderBy: { min_amount: "asc" } }),
    prisma.promotions.findMany({ where: { is_active: true } }),
    getActiveTieredDiscountRules(),
    promo_code_id != null
      ? prisma.promo_codes.findFirst({
          where: { id: BigInt(promo_code_id), is_active: true },
        })
      : Promise.resolve(null),
  ]);

  const vmap = new Map<number, VariantRow>();
  for (const v of variants) {
    vmap.set(Number(v.id), v as VariantRow);
  }

  for (const line of mergedLines) {
    if (!vmap.has(line.variantId)) {
      return { ok: false, error: "สินค้าบางรายการไม่พร้อมจำหน่าย" };
    }
  }

  if (promo_code_id != null && !promoRow) {
    return { ok: false, error: "Invalid or expired promo code" };
  }

  const paidLines = mergedLines.filter((l) => l.isFreeGift !== true);
  const giftLines = mergedLines.filter((l) => l.isFreeGift === true);

  const paidCartItemsDraft: CartItem[] = paidLines.map((line) => {
    const v = vmap.get(line.variantId)!;
    const { unitBaht } = resolveListingUnitBaht(v);
    const pid = v.product_id != null ? Number(v.product_id) : 0;

    return {
      variantId: line.variantId,
      productId: pid,
      productName: v.products?.name ?? line.productName,
      productImage: null,
      unitLabel: v.unit_label,
      price: unitBaht,
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

  const dbPrices: CheckoutValidationFailureDetails["dbPrices"] = paidCartItems.map((i) => {
    const v = vmap.get(i.variantId)!;
    const { unitBaht, source } = resolveListingUnitBaht(v);
    return {
      variantId: i.variantId,
      productId: i.productId,
      unitBaht,
      source,
    };
  });

  const paidSubtotal = roundCheckoutBahtWhole(
    satangIntToBaht(
      paidCartItems.reduce((s, i) => s + bahtToSatangInt(i.price * i.quantity), 0),
    ),
  );

  if (promoRow) {
    const minSpend = promoRow.min_spend != null ? Number(promoRow.min_spend) : 0;
    if (minSpend > 0 && bahtToSatangInt(paidSubtotal) < bahtToSatangInt(minSpend)) {
      return { ok: false, error: "Order total does not meet the minimum spend for this promo code" };
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

  if (
    sortGiftTuples(expectedGifts) !==
    sortGiftTuples(
      giftLines.map((g) => ({
        variantId: g.variantId,
        quantity: g.quantity,
      })),
    )
  ) {
    return { ok: false, error: "ของแถมในตะกร้าไม่ตรงกับโปรโมชัน" };
  }

  const tiers: DiscountTier[] = discountTierRows.map((t) => ({
    id: Number(t.id),
    min_amount: Number(t.min_amount),
    discount_percentage: Number(t.discount_percentage),
    is_active: t.is_active ?? true,
  }));

  const tiered: TieredDiscountRule[] = tieredRules;

  const promoInfo: PromoInfo | null =
    promoRow && promo_code_id != null
      ? {
          discount_type: String(promoRow.discount_type ?? "PERCENTAGE"),
          discount_value: Number(promoRow.discount_value ?? 0),
        }
      : null;

  const serverSummary = buildCheckoutSummaryFromPaidItems({
    paidItems: paidCartItems,
    tiers,
    tiered,
    promoInfo,
  });

  const grandTotalMismatch =
    bahtToSatangInt(clientSummary.total) !== bahtToSatangInt(serverSummary.total);

  if (grandTotalMismatch) {
    const details: CheckoutValidationFailureDetails = {
      clientValues: clientSummary,
      serverValues: serverSummary,
      dbPrices,
    };
    if (purpose === "prompt_pay_preview") {
      console.warn("[checkout-server-validate] PromptPay preview: client grand total ignored", {
        ...details,
        diffBaht: clientSummary.total - serverSummary.total,
      });
    } else {
      console.error("[checkout-server-validate] AMOUNT_MISMATCH", JSON.stringify(details));
      return {
        ok: false,
        error: "ยอดเงินไม่ตรงกับระบบ กรุณารีเฟรชหน้าแล้วลองใหม่",
        details,
      };
    }
  }

  const normalizedForOrder: LineIn[] = [...paidLines, ...giftLines];
  const resolvedItems: CheckoutItem[] = normalizedForOrder.map((line) => {
    const v = vmap.get(line.variantId)!;
    const gift = line.isFreeGift === true;
    const { unitBaht } = resolveListingUnitBaht(v);
    return {
      variantId: line.variantId,
      quantity: line.quantity,
      price: gift ? 0 : unitBaht,
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
