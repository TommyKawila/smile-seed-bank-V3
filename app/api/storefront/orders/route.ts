import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
        variantId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
        isFreeGift: z.boolean().optional(),
        productName: z.string().min(1, "product name required"),
      })
    )
    .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ"),
  summary: z.object({
    subtotal: z.number(),
    discount: z.number(),
    shipping: z.number(),
    total: z.number(),
  }),
  payment_method: z.string().min(1),
  customer_id: z.string().uuid().nullable().optional(),
  promo_code_id: z.number().int().nullable().optional(),
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

    const { data, error } = await createOrder({
      customer: {
        full_name: customer.full_name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email ?? null,
        line_user_id: null,
      },
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price,
        productName: i.productName,
        isFreeGift: i.isFreeGift,
      })),
      summary,
      payment_method,
      customer_id: customer_id ?? null,
      promo_code_id: promo_code_id ?? null,
      order_note: order_note?.trim() || null,
    });

    if (error || !data) {
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
      return NextResponse.json({ error: error ?? "สร้างคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
    }

    // Fire-and-forget: enrich item names from DB then send email
    const paidItems = items.filter((i) => !i.isFreeGift);
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
        freeGiftCount: items.filter((i) => i.isFreeGift).length,
        subtotal: summary.subtotal,
        discount: summary.discount,
        shipping: summary.shipping,
        total: summary.total,
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
