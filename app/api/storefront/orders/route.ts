import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateStorefrontCheckoutTotals } from "@/lib/checkout-server-validate";
import { quantizeBaht2, roundCheckoutBahtWhole } from "@/lib/money-thb";
import { createOrderAccessQuery } from "@/lib/order-access-token";
import { rateLimitIp } from "@/lib/rate-limit-ip";
import { logSecurityEvent } from "@/lib/security-log";
import { createOrder, fetchEmailItems } from "@/lib/services/order-service";
import { sendOrderConfirmationEmail } from "@/services/email-service";

const MoneyAmountSchema = z.coerce
  .number()
  .finite()
  .nonnegative()
  .transform((value) => quantizeBaht2(value));

const CheckoutWholeBahtSchema = z.coerce
  .number()
  .finite()
  .nonnegative()
  .transform((value) => roundCheckoutBahtWhole(value));

const CheckoutSchema = z.object({
  customer: z.object({
    full_name: z.string().min(2, "กรุณาระบุชื่อ"),
    phone: z.string().min(9, "เบอร์โทรไม่ถูกต้อง"),
    address: z.string().min(10, "กรุณาระบุที่อยู่"),
    email: z.string().email().nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        variantId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
        price: MoneyAmountSchema,
        isFreeGift: z.boolean().optional(),
        productName: z.string().min(1, "product name required"),
      })
    )
    .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ"),
  summary: z.object({
    subtotal: CheckoutWholeBahtSchema,
    discount: CheckoutWholeBahtSchema,
    shipping: CheckoutWholeBahtSchema,
    total: CheckoutWholeBahtSchema,
  }),
  payment_method: z.string().min(1),
  customer_id: z.string().uuid().nullable().optional(),
  promo_code_id: z
    .union([z.coerce.number().int(), z.null()])
    .optional(),
  locale: z.enum(["th", "en"]).optional().default("th"),
  order_note: z.string().max(2000).optional().nullable(),
});

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimitIp(`checkout:${clientIp(req)}`, 12, 15 * 60 * 1000);
    if (!limited.ok) {
      logSecurityEvent("rate_limit_trip", { route: "storefront/orders", ip: clientIp(req) });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const {
      customer,
      items,
      summary,
      payment_method,
      customer_id,
      promo_code_id,
      locale,
      order_note,
    } = parsed.data;

    const resolvedCustomerId = customer_id ?? null;
    /** Guests never apply promo server-side (avoids 403 if client sends stale promo_id). */
    const resolvedPromoId =
      resolvedCustomerId == null ? null : (promo_code_id ?? null);

    let sessionUserEmail: string | null = null;
    if (resolvedCustomerId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== resolvedCustomerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      sessionUserEmail = user.email?.trim() ?? null;
    }

    const effectivePromoId =
      resolvedPromoId != null && resolvedPromoId > 0
        ? await prisma.promo_codes
            .findFirst({
              where: {
                id: BigInt(resolvedPromoId),
                is_active: true,
                OR: [{ expiry_date: null }, { expiry_date: { gt: new Date() } }],
              },
              select: { id: true },
            })
            .then((row) => (row ? resolvedPromoId : null))
        : null;

    const firstOrderEmail = customer.email?.trim() || sessionUserEmail;

    const priced = await validateStorefrontCheckoutTotals({
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price,
        isFreeGift: i.isFreeGift === true,
        productName: i.productName,
      })),
      summary,
      promo_code_id: effectivePromoId,
      firstOrderGuard: {
        customerId: resolvedCustomerId,
        customerEmail: firstOrderEmail,
      },
    });
    if (!priced.ok) {
      return NextResponse.json(
        {
          error: priced.error,
          code: priced.details ? "AMOUNT_MISMATCH" : undefined,
          details: priced.details,
        },
        { status: 400 }
      );
    }

    // Fail closed BEFORE createOrder — otherwise stock is deducted with no payable link.
    const accessPreflight = createOrderAccessQuery("__access_preflight__");
    if (!accessPreflight.t?.trim() || !accessPreflight.e?.trim()) {
      console.error(
        "[POST /api/storefront/orders] access token empty — set RECEIPT_DOWNLOAD_SECRET"
      );
      return NextResponse.json(
        {
          error:
            "ระบบชำระเงินยังตั้งค่าไม่ครบ (RECEIPT_DOWNLOAD_SECRET) — กรุณาติดต่อร้าน",
        },
        { status: 503 }
      );
    }

    const { data, error } = await createOrder({
      customer: {
        full_name: customer.full_name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email ?? null,
        line_user_id: null,
      },
      items: priced.resolvedItems.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price,
        productName: i.productName,
        isFreeGift: i.isFreeGift,
      })),
      summary: {
        subtotal: quantizeBaht2(priced.resolvedSummary.subtotal),
        discount: quantizeBaht2(priced.resolvedSummary.discount),
        shipping: quantizeBaht2(priced.resolvedSummary.shipping),
        total: quantizeBaht2(priced.resolvedSummary.total),
      },
      payment_method,
      customer_id: resolvedCustomerId,
      promo_code_id: effectivePromoId,
      order_note: order_note?.trim() || null,
    });

    if (error || !data) {
      if (error === "PROMO_REQUIRES_ACCOUNT") {
        return NextResponse.json(
          { error: "Please sign in to use a promo code" },
          { status: 403 }
        );
      }
      if (error === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          { code: "INSUFFICIENT_STOCK", error: "INSUFFICIENT_STOCK" },
          { status: 409 }
        );
      }
      if (error === "CAMPAIGN_EXHAUSTED") {
        return NextResponse.json(
          { error: "This promo code has reached its usage limit" },
          { status: 400 }
        );
      }
      if (error === "CAMPAIGN_INACTIVE") {
        return NextResponse.json(
          { error: "This promo code cannot be used at this time" },
          { status: 400 }
        );
      }
      if (error === "PROMO_REQUIRES_PHONE") {
        return NextResponse.json(
          { error: "Please enter a phone number to use a promo code" },
          { status: 400 }
        );
      }
      if (error === "PROMO_PHONE_ALREADY_USED") {
        return NextResponse.json(
          { error: "This promo has already been used for this phone number" },
          { status: 400 }
        );
      }
      console.error("POST /api/storefront/orders createOrder:", error);
      return NextResponse.json({ error: "สร้างคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
    }

    // Fire-and-forget: enrich item names from DB then send email
    const paidItems = priced.resolvedItems.filter((i) => !i.isFreeGift);
    void (async () => {
      const emailItems = await fetchEmailItems(
        paidItems.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        }))
      );
      void sendOrderConfirmationEmail({
        toEmail: customer.email ?? "",
        toName: customer.full_name,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        paymentMethod: payment_method,
        orderStatus: "PENDING",
        items: emailItems,
        freeGiftCount: priced.resolvedItems.filter((i) => i.isFreeGift).length,
        subtotal: priced.resolvedSummary.subtotal,
        discount: priced.resolvedSummary.discount,
        shipping: priced.resolvedSummary.shipping,
        total: priced.resolvedSummary.total,
        shippingAddress: customer.address,
        locale,
      });
    })();

    const access = createOrderAccessQuery(data.orderNumber);
    if (!access.t?.trim() || !access.e?.trim()) {
      // Preflight passed; empty here is unexpected — still return tokens failure
      // without inventing a success path (order already exists; ops must set secret).
      console.error(
        "[POST /api/storefront/orders] access token empty after create — set RECEIPT_DOWNLOAD_SECRET"
      );
      return NextResponse.json(
        {
          error:
            "ระบบชำระเงินยังตั้งค่าไม่ครบ (RECEIPT_DOWNLOAD_SECRET) — กรุณาติดต่อร้าน",
          orderNumber: data.orderNumber,
          orderId: data.orderId,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        access: { t: access.t, e: access.e },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/storefront/orders error:", msg);
    return NextResponse.json({ error: "สร้างคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
  }
}
