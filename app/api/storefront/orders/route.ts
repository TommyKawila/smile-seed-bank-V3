import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateStorefrontCheckoutTotals } from "@/lib/checkout-server-validate";
import { createOrder, fetchEmailItems } from "@/lib/services/order-service";
import { sendOrderConfirmationEmail } from "@/services/email-service";

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
        price: z.coerce.number().nonnegative(),
        isFreeGift: z.boolean().optional(),
        productName: z.string().min(1, "product name required"),
      })
    )
    .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ"),
  summary: z.object({
    subtotal: z.coerce.number(),
    discount: z.coerce.number(),
    shipping: z.coerce.number(),
    total: z.coerce.number(),
  }),
  payment_method: z.string().min(1),
  customer_id: z.string().uuid().nullable().optional(),
  promo_code_id: z
    .union([z.coerce.number().int(), z.null()])
    .optional(),
  locale: z.enum(["th", "en"]).optional().default("th"),
  order_note: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
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

    if (resolvedCustomerId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== resolvedCustomerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

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
    });
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: 400 });
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
      summary: priced.resolvedSummary,
      payment_method,
      customer_id: resolvedCustomerId,
      promo_code_id: resolvedPromoId,
      order_note: order_note?.trim() || null,
    });

    if (error || !data) {
      if (error === "PROMO_REQUIRES_ACCOUNT") {
        return NextResponse.json(
          { error: "กรุณาเข้าสู่ระบบเพื่อใช้โค้ดส่วนลด" },
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
          { error: "โค้ดนี้ถูกใช้ครบโควตาแล้ว" },
          { status: 400 }
        );
      }
      if (error === "CAMPAIGN_INACTIVE") {
        return NextResponse.json(
          { error: "โค้ดนี้ไม่สามารถใช้ได้ในช่วงเวลานี้" },
          { status: 400 }
        );
      }
      if (error === "PROMO_REQUIRES_PHONE") {
        return NextResponse.json(
          { error: "กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด" },
          { status: 400 }
        );
      }
      if (error === "PROMO_PHONE_ALREADY_USED") {
        return NextResponse.json(
          { error: "สิทธิ์นี้ถูกใช้งานไปแล้วสำหรับเบอร์โทรศัพท์นี้" },
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

    return NextResponse.json(
      { orderNumber: data.orderNumber, orderId: data.orderId },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/storefront/orders error:", msg);
    return NextResponse.json({ error: "สร้างคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
  }
}
