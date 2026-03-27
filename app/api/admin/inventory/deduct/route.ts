import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bigintToJson } from "@/lib/bigint-json";
import { createManualOrderFromItems } from "@/lib/services/manual-order-create";

const ItemSchema = z.object({
  variantId: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string().min(1),
  unitLabel: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1),
  totalAmount: z.number().nonnegative().optional(),
  customer: z
    .object({
      full_name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      payment_method: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const { items, totalAmount: overrideTotal, customer } = parsed.data;
    const total_amount = overrideTotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);

    const { orderNumber } = await createManualOrderFromItems({
      items: items.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        productName: i.productName,
        unitLabel: i.unitLabel,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      total_amount,
      customer: customer
        ? {
            full_name: customer.full_name,
            phone: customer.phone,
            address: customer.address,
            payment_method: customer.payment_method,
            note: customer.note,
          }
        : undefined,
    });

    return NextResponse.json(bigintToJson({ success: true, orderNumber }), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
