import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sql = getSql();

    const orders = await sql`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.payment_method,
        o.tracking_number,
        o.shipping_provider,
        o.shipping_address,
        o.created_at,
        o.shipping_fee,
        o.discount_amount,
        o.promotion_discount_amount,
        o.points_discount_amount,
        (
          SELECT c.code
          FROM promo_code_usages u
          INNER JOIN promo_codes c ON c.id = u.promo_code_id
          WHERE u.order_id = o.id
          LIMIT 1
        ) AS promo_code
      FROM orders o
      WHERE o.customer_id = ${user.id}
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

    if (orders.length === 0) return NextResponse.json({ orders: [] });

    const orderIds = orders.map((o) => (o as { id: number }).id);

    // Join breeders + flowering_type for rich product display
    const items = await sql`
      SELECT
        oi.id,
        oi.order_id,
        oi.quantity,
        oi.unit_price,
        pv.id              AS variant_id,
        pv.unit_label,
        p.id               AS product_id,
        p.name             AS product_name,
        p.image_url        AS product_image_url,
        p.flowering_type,
        b.name             AS breeder_name
      FROM order_items oi
      LEFT JOIN product_variants pv ON pv.id  = oi.variant_id
      LEFT JOIN products p          ON p.id   = pv.product_id
      LEFT JOIN breeders b          ON b.id   = p.breeder_id
      WHERE oi.order_id IN ${sql(orderIds)}
    `;

    type RawItem = {
      id: number; order_id: number; quantity: number; unit_price: number;
      variant_id: number | null; unit_label: string | null;
      product_id: number | null; product_name: string | null;
      product_image_url: string | null;
      flowering_type: string | null;
      breeder_name: string | null;
    };

    const itemsByOrder = new Map<number, RawItem[]>();
    for (const item of items as RawItem[]) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id)!.push(item);
    }

    const result = (orders as {
      id: number; order_number: string; status: string; total_amount: number;
      payment_method: string; tracking_number: string | null;
      shipping_provider: string | null;
      shipping_address: string | null; created_at: string;
      shipping_fee: unknown;
      discount_amount: unknown;
      promotion_discount_amount: unknown;
      points_discount_amount: unknown;
      promo_code: string | null;
    }[]).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_amount: Number(order.total_amount),
      shipping_fee: Number(order.shipping_fee ?? 0),
      discount_amount: Number(order.discount_amount ?? 0),
      promotion_discount_amount: Number(order.promotion_discount_amount ?? 0),
      points_discount_amount: Number(order.points_discount_amount ?? 0),
      promo_code: order.promo_code?.trim() || null,
      payment_method: order.payment_method,
      tracking_number: order.tracking_number,
      shipping_provider: order.shipping_provider,
      shipping_address: order.shipping_address,
      created_at: order.created_at,
      order_items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        product_variants: item.variant_id
          ? {
              unit_label: item.unit_label ?? "",
              flowering_type: item.flowering_type ?? null,
              breeder_name: item.breeder_name ?? null,
              products: {
                id: item.product_id ?? 0,
                name: item.product_name ?? "สินค้า",
                image_url: item.product_image_url,
              },
            }
          : null,
      })),
    }));

    return NextResponse.json({ orders: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[profile/orders] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
