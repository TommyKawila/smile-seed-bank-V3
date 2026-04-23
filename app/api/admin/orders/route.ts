import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/order-utils";
import type { Order, OrderItem } from "@/types/supabase";
import {
  countOrdersByListTabs,
  countPaidReadyToShipOrders,
  listOrders,
} from "@/services/orders-service";

const ManualOrderSchema = z.object({
  customer: z.object({
    full_name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    payment_method: z.string().min(1),
    note: z.string().optional(),
  }),
  items: z.array(
    z.object({
      variantId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
      isFreeGift: z.boolean().optional(),
    })
  ).min(1),
  summary: z.object({
    subtotal: z.number(),
    discount: z.number(),
    shipping: z.number(),
    total: z.number(),
  }),
  promoCode: z.string().nullable().optional(),
  orderOrigin: z.enum(["MANUAL", "WEB"]).default("MANUAL"),
});

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const statusTab = req.nextUrl.searchParams.get("statusTab") ?? undefined;
    const dateRange = req.nextUrl.searchParams.get("dateRange") ?? undefined;
    const includePaidCount = req.nextUrl.searchParams.get("includePaidCount") === "1";
    const includeTabCounts = req.nextUrl.searchParams.get("includeTabCounts") === "1";
    const { data, error } = await listOrders({ status, statusTab, dateRange });
    if (error) return NextResponse.json({ error }, { status: 500 });
    let paidQueueCount: number | undefined;
    if (includePaidCount && dateRange) {
      paidQueueCount = await countPaidReadyToShipOrders(dateRange);
    } else if (includePaidCount) {
      paidQueueCount = await countPaidReadyToShipOrders("all");
    }
    let tabCounts: Awaited<ReturnType<typeof countOrdersByListTabs>> | undefined;
    if (includeTabCounts) {
      tabCounts = await countOrdersByListTabs();
    }
    return NextResponse.json({
      orders: data ?? [],
      ...(paidQueueCount !== undefined ? { paidQueueCount } : {}),
      ...(tabCounts !== undefined ? { tabCounts } : {}),
    });
  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ManualOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { customer, items, summary, orderOrigin } = parsed.data;
    const supabase = await createClient();
    const db = supabase as any; // eslint-disable-line

    // Fetch cost snapshots
    const variantIds = items.map((i) => i.variantId);
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, cost_price")
      .in("id", variantIds);

    const costMap = new Map(
      (variants ?? []).map((v: { id: number; cost_price: number }) => [v.id, v.cost_price])
    );
    const totalCost = items.reduce(
      (sum, i) => sum + (costMap.get(i.variantId) ?? 0) * i.quantity,
      0
    );

    const itemsSum = items.reduce((s, i) => s + i.quantity * i.price, 0);
    const shipping_fee = Math.max(0, summary.shipping);
    const discount_amount = Math.max(0, summary.discount);
    const total_amount = itemsSum + shipping_fee - discount_amount;

    const orderNumber = generateOrderNumber();

    const { data: newOrder, error: orderError } = await db
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: null,
        order_origin: orderOrigin,
        payment_method: customer.payment_method,
        shipping_address: customer.address,    // snapshot ที่อยู่จัดส่ง
        total_amount,
        total_cost: totalCost,
        shipping_fee,
        discount_amount,
        status: "PENDING",
      } satisfies Partial<Order>)
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);
    const orderId = (newOrder as { id: number }).id;

    const orderItems: Omit<OrderItem, "id">[] = items.map((item) => ({
      order_id: orderId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.price,
      unit_cost: costMap.get(item.variantId) ?? 0,
    }));

    const { error: itemsError } = await db.from("order_items").insert(orderItems);
    if (itemsError) throw new Error(itemsError.message);

    return NextResponse.json({ orderNumber, orderId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
