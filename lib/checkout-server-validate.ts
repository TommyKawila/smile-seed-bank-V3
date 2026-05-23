import { prisma } from "@/lib/prisma";
import {
  evaluateFreeGifts,
} from "@/lib/cart-utils";
import type { CartItem, Promotion } from "@/types/supabase";
import type { PromoInfo } from "@/lib/services/checkout-promo-math";
import {
  activeBrandRulesFromRows,
  applyBrandPercentToUnitBaht,
  matchBrandPromotionRule,
  type BrandPromotionRuleRow,
} from "@/lib/brand-promotion-checkout";
import { bahtToSatangInt, roundCheckoutBahtWhole, satangIntToBaht } from "@/lib/money-thb";
import { shippingFeeForSubtotal } from "@/lib/order-financials";
import { computeCouponDiscountBahtOnSubtotal } from "@/lib/services/checkout-promo-math";
import { customerHasCompletedOrderForFirstOrderPromo } from "@/lib/services/coupon-service";
import { isPromoQaBypassEmail } from "@/lib/promo-qa-bypass-email";
import type { CheckoutItem, CheckoutSummary } from "@/lib/services/order-service";

type LineIn = {
  variantId: number;
  quantity: number;
  price: number;
  isFreeGift?: boolean;
  productName: string;
};

export type PriceSource = "variant" | "product_fallback" | "brand_promotion" | "clearance";

export type CheckoutValidationFailureDetails = {
  clientValues: CheckoutSummary;
  serverValues: CheckoutSummary;
  dbPrices: {
    variantId: number;
    productId: number;
    unitBaht: number;
    source: PriceSource;
  }[];
};

function normalizeCheckoutVariantId(v: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

type ProductVariantPriceRow = {
  price: unknown;
  stock: number | null;
  is_active: boolean | null;
};

type VariantRow = {
  id: bigint;
  product_id: bigint | null;
  unit_label: string;
  price: unknown;
  clearance_price: unknown;
  products: {
    id: bigint;
    name: string;
    price: unknown;
    sale_price: unknown;
    is_clearance: boolean | null;
    product_variants: ProductVariantPriceRow[];
    breeders: { name: string } | null;
  } | null;
};

/** Prisma Decimal / string / number → finite THB or NaN. */
export function coerceDbPriceBaht(raw: unknown): number {
  if (raw == null) return NaN;
  if (
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as { toString?: () => string }).toString === "function"
  ) {
    const n = Number((raw as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : NaN;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function checkoutStartingPrice(
  variants: ProductVariantPriceRow[] | null | undefined,
): number {
  if (!variants?.length) return 0;
  const priced = variants
    .filter((v) => v.is_active !== false)
    .map((v) => ({
      price: coerceDbPriceBaht(v.price),
      stock: Number(v.stock ?? 0),
    }))
    .filter((v) => v.price > 0);
  if (priced.length === 0) return 0;
  const inStock = priced.filter((v) => v.stock > 0);
  const pool = inStock.length > 0 ? inStock : priced;
  return Math.min(...pool.map((v) => v.price));
}

function resolveClearanceUnitBaht(v: VariantRow, base: number): number | null {
  if (v.products?.is_clearance !== true || base <= 0) return null;
  const explicit = coerceDbPriceBaht(v.clearance_price);
  if (explicit > 0) return roundCheckoutBahtWhole(Math.min(base, explicit));

  const sale = coerceDbPriceBaht(v.products.sale_price);
  if (sale <= 0) return null;
  const starting = checkoutStartingPrice(v.products.product_variants);
  if (starting <= 0) return roundCheckoutBahtWhole(Math.min(base, sale));
  return roundCheckoutBahtWhole(Math.min(base, Math.max(1, sale * (base / starting))));
}

/**
 * Base unit from variant / product row, then brand %, then clearance fallback — round whole Baht.
 */
function resolveListingUnitBaht(
  v: VariantRow,
  brandRules: BrandPromotionRuleRow[],
): { unitBaht: number; source: PriceSource } {
  const variantPrice = coerceDbPriceBaht(v.price);
  let base: number;
  let baseSource: "variant" | "product_fallback";
  if (variantPrice > 0) {
    base = roundCheckoutBahtWhole(variantPrice);
    baseSource = "variant";
  } else {
    const rawProduct = coerceDbPriceBaht(v.products?.price);
    const productPrice = rawProduct > 0 ? rawProduct : 0;
    base = roundCheckoutBahtWhole(productPrice);
    baseSource = "product_fallback";
  }

  const breederName = v.products?.breeders?.name ?? null;
  const rule = matchBrandPromotionRule(brandRules, breederName);
  if (rule && rule.discount_percent > 0 && base > 0) {
    return {
      unitBaht: applyBrandPercentToUnitBaht(base, rule.discount_percent),
      source: "brand_promotion",
    };
  }
  const clearance = resolveClearanceUnitBaht(v, base);
  if (clearance != null && clearance > 0 && clearance < base) {
    return { unitBaht: clearance, source: "clearance" };
  }
  return { unitBaht: base, source: baseSource };
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

function buildStorefrontCheckoutSummary(input: {
  paidItems: CartItem[];
  promoInfo: PromoInfo | null;
}): CheckoutSummary {
  const { paidItems, promoInfo } = input;
  const subtotalSatang = paidItems.reduce(
    (s, i) => s + bahtToSatangInt(i.price * i.quantity),
    0,
  );
  const subtotal = roundCheckoutBahtWhole(satangIntToBaht(subtotalSatang));

  const couponDiscount = promoInfo
    ? roundCheckoutBahtWhole(computeCouponDiscountBahtOnSubtotal(subtotal, promoInfo))
    : 0;

  const netBeforeShipping = Math.max(
    0,
    roundCheckoutBahtWhole(
      satangIntToBaht(bahtToSatangInt(subtotal) - bahtToSatangInt(couponDiscount)),
    ),
  );
  const shipping = roundCheckoutBahtWhole(shippingFeeForSubtotal(netBeforeShipping));
  const total = roundCheckoutBahtWhole(
    satangIntToBaht(
      bahtToSatangInt(netBeforeShipping) + bahtToSatangInt(shipping),
    ),
  );

  return { subtotal, discount: couponDiscount, shipping, total };
}

const WELCOME10_CODE = "WELCOME10";

function normalizePromoCode(code: string | null | undefined): string {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

function clientSummaryMatchesServer(
  purpose: "order_create" | "prompt_pay_preview",
  client: CheckoutSummary,
  server: CheckoutSummary,
): boolean {
  if (purpose === "prompt_pay_preview") {
    return bahtToSatangInt(client.total) === bahtToSatangInt(server.total);
  }
  return (
    bahtToSatangInt(client.subtotal) === bahtToSatangInt(server.subtotal) &&
    bahtToSatangInt(client.discount) === bahtToSatangInt(server.discount) &&
    bahtToSatangInt(client.shipping) === bahtToSatangInt(server.shipping) &&
    bahtToSatangInt(client.total) === bahtToSatangInt(server.total)
  );
}

/**
 * Recomputes cart totals from DB (variant → brand rules → coupon → shipping). Client line prices ignored for paid rows.
 */
export async function validateStorefrontCheckoutTotals(input: {
  items: LineIn[];
  summary: CheckoutSummary;
  promo_code_id: number | null;
  purpose?: "order_create" | "prompt_pay_preview";
  /** Required for WELCOME10 first-order guard when that promo is applied. */
  firstOrderGuard?: { customerId: string | null; customerEmail: string | null };
}): Promise<
  | { ok: true; resolvedItems: CheckoutItem[]; resolvedSummary: CheckoutSummary }
  | { ok: false; error: string; details?: CheckoutValidationFailureDetails }
> {
  const {
    items: rawLines,
    promo_code_id,
    purpose = "order_create",
    firstOrderGuard,
  } = input;
  const clientSummary = snapSummary(input.summary);

  for (const row of rawLines) {
    const v = normalizeCheckoutVariantId(row.variantId);
    if (!Number.isFinite(v) || v < 1) {
      return { ok: false, error: "สินค้าบางรายการไม่ถูกต้อง" };
    }
  }

  const mergedLines = mergeCheckoutDuplicateLines(rawLines);
  const variantIds = [...new Set(mergedLines.map((l) => l.variantId))].map((id) => BigInt(id));

  const [variants, promotionRows, promoRow, brandRowsRaw] = await Promise.all([
    prisma.product_variants.findMany({
      where: { id: { in: variantIds }, is_active: true },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            sale_price: true,
            is_clearance: true,
            product_variants: {
              select: {
                price: true,
                stock: true,
                is_active: true,
              },
            },
            breeders: { select: { name: true } },
          },
        },
      },
    }),
    prisma.promotions.findMany({ where: { is_active: true } }),
    promo_code_id != null
      ? prisma.promo_codes.findFirst({
          where: { id: BigInt(promo_code_id), is_active: true },
        })
      : Promise.resolve(null),
    prisma.brand_promotions.findMany({
      where: { is_active: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const brandRules = activeBrandRulesFromRows(
    brandRowsRaw.map((r) => ({
      brand_name: r.brand_name,
      discount_percent: r.discount_percent,
      is_active: r.is_active,
    })),
  );

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

  const guardEmail = firstOrderGuard?.customerEmail?.trim() ?? null;
  const firstOrderBlocked =
    promoRow &&
    !isPromoQaBypassEmail(guardEmail) &&
    (normalizePromoCode(promoRow.code) === WELCOME10_CODE || promoRow.first_order_only === true) &&
    (await customerHasCompletedOrderForFirstOrderPromo(
      firstOrderGuard?.customerId?.trim() ?? null,
      guardEmail,
    ));
  if (firstOrderBlocked) {
    return {
      ok: false,
      error: "โค้ดนี้สำหรับลูกค้าใหม่ที่สั่งซื้อครั้งแรกเท่านั้น",
    };
  }

  const paidLines = mergedLines.filter((l) => l.isFreeGift !== true);
  const giftLines = mergedLines.filter((l) => l.isFreeGift === true);

  const paidCartItemsDraft: CartItem[] = paidLines.map((line) => {
    const v = vmap.get(line.variantId)!;
    const { unitBaht } = resolveListingUnitBaht(v, brandRules);
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
      breederName: v.products?.breeders?.name ?? null,
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
    const { unitBaht, source } = resolveListingUnitBaht(v, brandRules);
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

  const expectedGifts = evaluateFreeGifts(paidCartItems, promotions, "TRANSFER", brandRules)
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

  const promoInfo: PromoInfo | null =
    promoRow && promo_code_id != null
      ? {
          discount_type: String(promoRow.discount_type ?? "PERCENTAGE"),
          discount_value: Number(promoRow.discount_value ?? 0),
        }
      : null;

  const serverSummary = buildStorefrontCheckoutSummary({
    paidItems: paidCartItems,
    promoInfo,
  });

  const mismatch = !clientSummaryMatchesServer(purpose, clientSummary, serverSummary);

  if (mismatch) {
    const details: CheckoutValidationFailureDetails = {
      clientValues: clientSummary,
      serverValues: serverSummary,
      dbPrices,
    };
    if (purpose === "prompt_pay_preview") {
      console.warn("[checkout-server-validate] PromptPay preview: client totals ignored", {
        ...details,
        diffBaht: clientSummary.total - serverSummary.total,
      });
    } else {
      console.error("[checkout-server-validate] CHECKOUT_MISMATCH", JSON.stringify(details));
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
    const { unitBaht } = resolveListingUnitBaht(v, brandRules);
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
