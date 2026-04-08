import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { generateOrderNumber } from "@/lib/utils";
import { sendLowStockAlert } from "@/services/line-messaging";

const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        productId: z.number().int().positive(),
        productName: z.string().min(1),
        unitLabel: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      })
    )
    .min(1),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
  totalAmount: z.number().nonnegative().optional(),
  points_redeemed: z.number().int().min(0).optional(),
  points_discount_amount: z.number().nonnegative().optional(),
  promotion_rule_id: z.number().int().positive().optional().nullable(),
  promotion_discount_amount: z.number().nonnegative().optional(),
  customer_profile_id: z.number().int().positive().optional().nullable(),
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
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const { items, status, totalAmount: overrideTotal, points_redeemed = 0, points_discount_amount = 0, promotion_rule_id, promotion_discount_amount = 0, customer_profile_id, customer } = parsed.data;
    const totalAmount = overrideTotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);

    const orderNumber = generateOrderNumber();
    let totalCostAcc = 0;
    /** Collected inside the transaction; LINE alerts run after commit (must be in outer scope). */
    const postDeductionLowStockAlerts: { name: string; unitLabel: string; stock: number }[] = [];

    const { orderId: createdOrderId } = await prisma.$transaction(async (tx) => {
      const orderCreate: Prisma.ordersCreateInput = {
        order_number: orderNumber,
        total_amount: new Prisma.Decimal(totalAmount),
        total_cost: new Prisma.Decimal(0),
        shipping_fee: new Prisma.Decimal(0),
        discount_amount: new Prisma.Decimal(0),
        status,
        order_origin: "MANUAL",
        points_redeemed: points_redeemed,
        points_discount_amount: new Prisma.Decimal(points_discount_amount),
        promotion_rule_id: promotion_rule_id ? BigInt(promotion_rule_id) : null,
        promotion_discount_amount: new Prisma.Decimal(promotion_discount_amount),
        payment_method: customer?.payment_method ?? null,
        shipping_address: customer?.address ?? null,
        customer_name: customer?.full_name ?? null,
        customer_phone: customer?.phone ?? null,
        customer_note: customer?.note ?? null,
      };
      if (customer_profile_id) {
        orderCreate.customer_profile = { connect: { id: BigInt(customer_profile_id) } };
      }
      const order = await tx.orders.create({ data: orderCreate });

      for (const item of items) {
        const variant = await tx.product_variants.findUnique({
          where: { id: BigInt(item.variantId) },
          select: { stock: true, cost_price: true, unit_label: true, low_stock_threshold: true, products: { select: { name: true } } },
        });
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        const currentStock = variant.stock ?? 0;
        if (status === "COMPLETED" && currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.productName} (${item.unitLabel}): need ${item.quantity}, have ${currentStock}`
          );
        }

        const lineTotal = item.price * item.quantity;
        const costPrice = Number(variant.cost_price ?? 0);
        totalCostAcc += costPrice * item.quantity;

        if (status === "COMPLETED") {
          const afterStock = currentStock - item.quantity;
          const threshold = variant.low_stock_threshold ?? 5;
          if (afterStock <= threshold) {
            postDeductionLowStockAlerts.push({
              name: (variant.products as { name?: string })?.name ?? item.productName,
              unitLabel: variant.unit_label,
              stock: afterStock,
            });
          }
        }

        const lineCreate: Prisma.order_itemsCreateInput = {
          orders: { connect: { id: order.id } },
          variant_id: BigInt(item.variantId),
          product_id: BigInt(item.productId),
          product_name: item.productName,
          unit_label: item.unitLabel ?? null,
          quantity: item.quantity,
          unit_price: new Prisma.Decimal(item.price),
          unit_cost: new Prisma.Decimal(costPrice),
          total_price: new Prisma.Decimal(lineTotal),
          subtotal: new Prisma.Decimal(lineTotal),
        };
        await tx.order_items.create({ data: lineCreate });

        if (status === "COMPLETED") {
          await tx.product_variants.update({
            where: { id: BigInt(item.variantId) },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.orders.update({
        where: { id: order.id },
        data: { total_cost: new Prisma.Decimal(totalCostAcc) },
      });

      if (status === "COMPLETED" && customer_profile_id) {
        const ptsRedeemed = points_redeemed ?? 0;
        const pointsToAdd = Math.floor(totalAmount / 100);
        const cust = await tx.customer.findUnique({
          where: { id: BigInt(customer_profile_id) },
          select: { points: true },
        });
        if (cust && ptsRedeemed > 0 && (cust.points ?? 0) < ptsRedeemed) {
          throw new Error("Insufficient customer points");
        }
        await tx.customer.update({
          where: { id: BigInt(customer_profile_id) },
          data: {
            points: { increment: pointsToAdd - ptsRedeemed },
            total_spend: { increment: new Prisma.Decimal(totalAmount) },
          },
        });
      }

      return { orderId: order.id };
    });

    if (status === "COMPLETED" && postDeductionLowStockAlerts.length > 0) {
      void (async () => {
        for (const v of postDeductionLowStockAlerts) {
          const r = await sendLowStockAlert({ productName: v.name, unitLabel: v.unitLabel, stock: v.stock });
          if (!r.success) console.error("[orders/simple] LINE low stock alert:", r.error);
        }
      })();
    }

    return NextResponse.json(
      bigintToJson({ orderNumber, status, orderId: createdOrderId }),
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
