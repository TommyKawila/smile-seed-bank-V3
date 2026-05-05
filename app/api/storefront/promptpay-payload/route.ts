import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSql } from "@/lib/db";
import { validateStorefrontCheckoutTotals } from "@/lib/checkout-server-validate";
import { buildPromptPayPayload } from "@/lib/payment-utils";
import { quantizeBaht2 } from "@/lib/money-thb";
import { getOrderByNumber } from "@/lib/services/order-service";

export const revalidate = 0;

type PromptPayJson = { identifier?: string; isActive?: boolean; is_active?: boolean };

function explicitInactive(pp: PromptPayJson | null): boolean {
  return pp != null && (pp.isActive === false || pp.is_active === false);
}

async function getPromptPayMerchantIdFromSettings(): Promise<string | null> {
  try {
    const rows = await getSql()`
      SELECT prompt_pay
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    const raw = rows[0]?.prompt_pay as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const pp = raw as PromptPayJson;
    if (explicitInactive(pp)) return null;
    const id = pp.identifier?.trim();
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

const CheckoutPayloadSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
        price: z.coerce.number().nonnegative(),
        isFreeGift: z.boolean().optional(),
        productName: z.string().min(1),
      }),
    )
    .min(1),
  summary: z.object({
    subtotal: z.coerce.number(),
    discount: z.coerce.number(),
    shipping: z.coerce.number(),
    total: z.coerce.number(),
  }),
  promo_code_id: z.union([z.coerce.number().int(), z.null()]).optional(),
  customer_id: z.string().uuid().nullable().optional(),
});

async function merchantId(): Promise<string> {
  const fromDb = await getPromptPayMerchantIdFromSettings();
  return fromDb ?? process.env.PROMPTPAY_MERCHANT_ID?.trim() ?? "";
}

/**
 * PromptPay QR: amount is recomputed server-side — POST (cart) or GET (?orderNumber=).
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = CheckoutPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { items, summary, customer_id } = parsed.data;
  const resolvedCustomerId = customer_id ?? null;
  const resolvedPromoId = resolvedCustomerId == null ? null : (parsed.data.promo_code_id ?? null);

  if (resolvedCustomerId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== resolvedCustomerId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const priced = await validateStorefrontCheckoutTotals({
    items: items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      price: i.price,
      isFreeGift: i.isFreeGift,
      productName: i.productName,
    })),
    summary,
    promo_code_id: resolvedPromoId,
  });

  if (!priced.ok) {
    console.warn("[promptpay-payload] POST checkout validation failed:", priced.error);
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  const amountBaht = priced.resolvedSummary.total;
  if (amountBaht <= 0 || amountBaht > 50_000_000) {
    console.warn("[promptpay-payload] POST amount out of range", quantizeBaht2(amountBaht));
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const mid = await merchantId();
  if (!mid) {
    return NextResponse.json({ payload: null, amountBaht: quantizeBaht2(amountBaht) }, { status: 200 });
  }

  const payload = buildPromptPayPayload(mid, amountBaht);
  return NextResponse.json(
    { payload: payload ?? null, amountBaht: quantizeBaht2(amountBaht) },
    { status: 200 },
  );
}

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber")?.trim();

  const mid = await merchantId();

  if (orderNumber) {
    const { data: order, error } = await getOrderByNumber(orderNumber);
    if (!order || error) {
      console.warn("[promptpay-payload] GET order not found:", orderNumber);
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    if (String(order.payment_method ?? "").toUpperCase() !== "TRANSFER") {
      console.warn("[promptpay-payload] GET order not TRANSFER:", orderNumber, order.payment_method);
      return NextResponse.json({ error: "unsupported_payment_method" }, { status: 400 });
    }

    const amountBaht = quantizeBaht2(Number(order.total_amount));
    if (!(amountBaht > 0) || amountBaht > 50_000_000) {
      console.warn("[promptpay-payload] GET invalid order total", orderNumber, order.total_amount);
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }

    if (!mid) {
      return NextResponse.json({ payload: null, amountBaht }, { status: 200 });
    }

    const payload = buildPromptPayPayload(mid, amountBaht);
    return NextResponse.json({ payload: payload ?? null, amountBaht }, { status: 200 });
  }

  const rawAmt = req.nextUrl.searchParams.get("amount");
  const parsed = rawAmt == null ? NaN : Number(rawAmt);
  const quantized = quantizeBaht2(parsed);

  console.warn(
    "[promptpay-payload] Deprecated GET ?amount= (not DB-backed); use POST checkout body or GET ?orderNumber=",
    { quantized },
  );

  if (!Number.isFinite(parsed) || !(quantized > 0) || quantized > 50_000_000) {
    return NextResponse.json({ error: "invalid_amount", amountBaht: null }, { status: 400 });
  }

  if (!mid) {
    return NextResponse.json({ payload: null, amountBaht: quantized }, { status: 200 });
  }

  const payload = buildPromptPayPayload(mid, quantized);
  return NextResponse.json({ payload: payload ?? null, amountBaht: quantized }, { status: 200 });
}
