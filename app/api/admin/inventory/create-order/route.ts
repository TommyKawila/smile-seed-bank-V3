import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/utils";
import { computeStartingPrice, computeTotalStock } from "@/lib/product-utils";
import type { ProductVariant } from "@/types/supabase";

export const dynamic = "force-dynamic";

const ItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  price: z.number().nonnegative(),
  cost_price: z.number().nonnegative(),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    const { items, note } = parsed.data;
    const supabase = await createAdminClient();

    // 1. Check stock availability before anything
    const variantIds = items.map((i) => i.variantId);
    const { data: dbVariants, error: fetchErr } = await supabase
      .from("product_variants")
      .select("id, stock, product_id")
      .in("id", variantIds);

    if (fetchErr) throw new Error(fetchErr.message);

    for (const item of items) {
      const dbV = (dbVariants ?? []).find((v: { id: number }) => v.id === item.variantId);
      if (!dbV) throw new Error(`Variant ${item.variantId} not found`);
      if (dbV.stock < item.quantity) throw new Error(`สต็อกไม่พอสำหรับ variant ${item.variantId} (มี ${dbV.stock}, ต้องการ ${item.quantity})`);
    }

    // 2. Create order
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalCost = items.reduce((s, i) => s + i.cost_price * i.quantity, 0);
    const orderNumber = generateOrderNumber();

    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: null,
        order_origin: "MANUAL",
        payment_method: "CASH",
        shipping_address: note ?? null,
        total_amount: totalAmount,
        total_cost: totalCost,
        shipping_fee: 0,
        discount_amount: 0,
        status: "PAID",
      })
      .select("id")
      .single();

    if (orderErr) throw new Error(orderErr.message);
    const orderId = (newOrder as { id: number }).id;

    // 3. Insert order_items
    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: orderId,
        variant_id: i.variantId,
        quantity: i.quantity,
        unit_price: i.price,
        unit_cost: i.cost_price,
      }))
    );
    if (itemsErr) throw new Error(itemsErr.message);

    // 4. Decrement stock for each variant and sync parent product
    const affectedProductIds = new Set<number>();
    for (const item of items) {
      const dbV = (dbVariants ?? []).find((v: { id: number; stock: number; product_id: number }) => v.id === item.variantId)!;
      const newStock = dbV.stock - item.quantity;
      const { error: stockErr } = await supabase
        .from("product_variants")
        .update({ stock: newStock })
        .eq("id", item.variantId);
      if (stockErr) throw new Error(stockErr.message);
      affectedProductIds.add(dbV.product_id);
    }

    // 5. Re-sync product-level stock + price
    for (const productId of affectedProductIds) {
      const { data: allV } = await supabase
        .from("product_variants")
        .select("id, price, stock, is_active")
        .eq("product_id", productId);
      if (allV?.length) {
        const startingPrice = computeStartingPrice(allV as ProductVariant[]);
        const totalStock = computeTotalStock(allV as ProductVariant[]);
        await supabase.from("products").update({ price: startingPrice, stock: totalStock }).eq("id", productId);
      }
    }

    return NextResponse.json({ success: true, orderNumber, orderId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
