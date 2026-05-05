import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSql } from "@/lib/db";
import { validateStorefrontCheckoutTotals } from "@/lib/checkout-server-validate";
import { buildPromptPayPayload } from "@/lib/payment-utils";
import { quantizeBaht2, sameBahtSatang } from "@/lib/money-thb";
import { getOrderByNumber } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PromptPayJson = { identifier?: string; isActive?: boolean; is_active?: boolean };

/** Safe for logs (Vercel / support); never full tax ID / phone in production logs. */
function maskMerchantId(secret: string | undefined | null): string {
  if (secret == null || !String(secret).trim()) return "(unset)";
  const s = String(secret).trim();
  if (s.length <= 4) return `(set; len=${s.length})`;
  return `${s.slice(0, 2)}…${s.slice(-2)} (len=${s.length})`;
}

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
  const envMasked = maskMerchantId(process.env.PROMPTPAY_MERCHANT_ID);
  let raw: unknown;
  try {
    raw = await req.json();
  } catch (err) {
    console.error("[promptpay-payload] POST invalid_json", {
      PROMPTPAY_MERCHANT_ID: envMasked,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = CheckoutPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[promptpay-payload] POST invalid_body", {
      PROMPTPAY_MERCHANT_ID: envMasked,
      zod: parsed.error.flatten(),
    });
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { items, summary, customer_id } = parsed.data;
  const resolvedCustomerId = customer_id ?? null;
  const resolvedPromoId = resolvedCustomerId == null ? null : (parsed.data.promo_code_id ?? null);

  const clientTotals = {
    subtotal: quantizeBaht2(summary.subtotal),
    discount: quantizeBaht2(summary.discount),
    shipping: quantizeBaht2(summary.shipping),
    total: quantizeBaht2(summary.total),
  };

  if (resolvedCustomerId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== resolvedCustomerId) {
      console.error("[promptpay-payload] POST unauthorized", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        calculatedTotal: null,
        amountBaht: null,
        clientSummaryTotal: clientTotals.total,
        reason: user ? "customer_id≠session user" : "no session cookie",
      });
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const priced = await validateStorefrontCheckoutTotals({
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price,
        isFreeGift: i.isFreeGift === true,
        productName: i.productName,
      })),
      summary,
      promo_code_id: resolvedPromoId,
      purpose: "prompt_pay_preview",
    });

    if (!priced.ok) {
      console.error("[promptpay-payload] POST validation failed", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        amountBaht: null,
        calculatedTotal: null,
        clientSummaryTotal: clientTotals.total,
        validatorError: priced.error,
      });
      return NextResponse.json({ error: priced.error }, { status: 400 });
    }

    /** Sole EMV amount: DB-backed totals from validator — never add client summary or subtotal. */
    const serverResolvedTotalBaht = quantizeBaht2(priced.resolvedSummary.total);
    const clientDeclaredTotalBaht = clientTotals.total;
    if (!sameBahtSatang(summary.total, priced.resolvedSummary.total)) {
      console.warn("[promptpay-payload] POST validation (informational): body summary.total≠server recomputed", {
        clientDeclaredTotalBaht,
        serverResolvedTotalBaht,
      });
    }

    if (!(serverResolvedTotalBaht > 0) || serverResolvedTotalBaht > 50_000_000) {
      console.error("[promptpay-payload] POST amount out of range", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        serverResolvedTotalBaht,
        clientDeclaredTotalBaht,
      });
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }

    const mid = await merchantId();
    const midMasked = maskMerchantId(mid || process.env.PROMPTPAY_MERCHANT_ID);

    if (!mid) {
      console.error("[promptpay-payload] POST no merchant ID (QR disabled)", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        serverResolvedTotalBaht,
        clientDeclaredTotalBaht,
        hint: "Set payment_settings.prompt_pay.identifier or PROMPTPAY_MERCHANT_ID on Vercel",
      });
      return NextResponse.json({ payload: null, amountBaht: serverResolvedTotalBaht }, { status: 200 });
    }

    const payload = buildPromptPayPayload(mid, serverResolvedTotalBaht);

    if (!payload) {
      console.error("[promptpay-payload] POST buildPromptPayPayload returned null", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        merchantResolvedMasked: midMasked,
        serverResolvedTotalBaht,
        clientDeclaredTotalBaht,
      });
    }

    return NextResponse.json(
      { payload: payload ?? null, amountBaht: serverResolvedTotalBaht },
      { status: 200 },
    );
  } catch (err) {
    console.error("[promptpay-payload] POST unhandled", {
      PROMPTPAY_MERCHANT_ID: envMasked,
      calculatedTotal: null,
      amountBaht: null,
      clientSummaryTotal: clientTotals.total,
      err: err instanceof Error ? err.stack ?? err.message : String(err),
    });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const envMasked = maskMerchantId(process.env.PROMPTPAY_MERCHANT_ID);

  try {
    const orderNumber = req.nextUrl.searchParams.get("orderNumber")?.trim();
    const mid = await merchantId();

    if (orderNumber) {
      const { data: order, error } = await getOrderByNumber(orderNumber);
      if (!order || error) {
        console.error("[promptpay-payload] GET order_not_found", {
          PROMPTPAY_MERCHANT_ID: envMasked,
          orderNumber,
          amountBaht: null,
          calculatedTotal: null,
        });
        return NextResponse.json({ error: "order_not_found" }, { status: 404 });
      }

      if (String(order.payment_method ?? "").toUpperCase() !== "TRANSFER") {
        console.error("[promptpay-payload] GET unsupported_payment_method", {
          PROMPTPAY_MERCHANT_ID: envMasked,
          orderNumber,
          payment_method: order.payment_method,
          calculatedTotal: null,
          amountBaht: null,
        });
        return NextResponse.json({ error: "unsupported_payment_method" }, { status: 400 });
      }

      const calculatedTotal = quantizeBaht2(Number(order.total_amount));
      const amountBaht = calculatedTotal;

      if (!(amountBaht > 0) || amountBaht > 50_000_000) {
        console.error("[promptpay-payload] GET invalid_amount", {
          PROMPTPAY_MERCHANT_ID: envMasked,
          orderNumber,
          rawTotal: order.total_amount,
          calculatedTotal,
          amountBaht: calculatedTotal,
        });
        return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
      }

      if (!mid) {
        console.error("[promptpay-payload] GET no merchant ID (QR disabled)", {
          PROMPTPAY_MERCHANT_ID: envMasked,
          orderNumber,
          calculatedTotal,
          amountBaht: calculatedTotal,
        });
        return NextResponse.json({ payload: null, amountBaht }, { status: 200 });
      }

      const payload = buildPromptPayPayload(mid, calculatedTotal);

      if (!payload) {
        console.error("[promptpay-payload] GET buildPromptPayPayload returned null", {
          PROMPTPAY_MERCHANT_ID: envMasked,
          merchantResolvedMasked: maskMerchantId(mid),
          calculatedTotal,
          amountBaht: calculatedTotal,
          orderNumber,
        });
      }

      return NextResponse.json({ payload: payload ?? null, amountBaht }, { status: 200 });
    }

    const rawAmt = req.nextUrl.searchParams.get("amount");
    const parsedNum = rawAmt == null ? NaN : Number(rawAmt);
    const quantized = quantizeBaht2(parsedNum);

    console.warn(
      "[promptpay-payload] Deprecated GET ?amount=",
      { quantized, PROMPTPAY_MERCHANT_ID: envMasked },
    );

    if (!Number.isFinite(parsedNum) || !(quantized > 0) || quantized > 50_000_000) {
      console.error("[promptpay-payload] GET invalid_amount (deprecated param)", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        rawAmt,
        calculatedTotal: quantized,
        amountBaht: quantized,
      });
      return NextResponse.json({ error: "invalid_amount", amountBaht: null }, { status: 400 });
    }

    if (!mid) {
      console.error("[promptpay-payload] GET deprecated: no merchant", {
        PROMPTPAY_MERCHANT_ID: envMasked,
        calculatedTotal: quantized,
        amountBaht: quantized,
      });
      return NextResponse.json({ payload: null, amountBaht: quantized }, { status: 200 });
    }

    const payload = buildPromptPayPayload(mid, quantized);
    return NextResponse.json({ payload: payload ?? null, amountBaht: quantized }, { status: 200 });
  } catch (err) {
    console.error("[promptpay-payload] GET unhandled", {
      PROMPTPAY_MERCHANT_ID: envMasked,
      calculatedTotal: null,
      amountBaht: null,
      err: err instanceof Error ? err.stack ?? err.message : String(err),
    });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
