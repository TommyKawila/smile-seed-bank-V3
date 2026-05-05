import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { randomUUID } from "crypto";
import { generateOrderNumber } from "@/lib/order-utils";
import { sendLowStockAlert } from "@/services/line-messaging";
import { deductVariantStockForOrderItems, InsufficientStockError } from "@/lib/order-inventory";

/** Matches `orders.status` string values used by POS / claim (DB column is String, not Prisma enum). */
const POS_ORDER_STATUS = ["PENDING", "PENDING_INFO", "COMPLETED", "CANCELLED"] as const;
type PosOrderStatus = (typeof POS_ORDER_STATUS)[number];

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
  status: z.enum(POS_ORDER_STATUS).default("COMPLETED"),
  totalAmount: z.number().nonnegative().optional(),
  points_redeemed: z.number().int().min(0).optional(),
  points_discount_amount: z.number().nonnegative().optional(),
  promotion_rule_id: z.number().int().positive().optional().nullable(),
  promotion_discount_amount: z.number().nonnegative().optional(),
  /** Manual POS discount (THB), e.g. VIP % off subtotal — stored in `orders.discount_amount` */
  discount_amount: z.number().nonnegative().optional(),
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

    const {
      items,
      status,
      totalAmount: overrideTotal,
      points_redeemed = 0,
      points_discount_amount = 0,
      promotion_rule_id,
      promotion_discount_amount = 0,
      discount_amount: manualDiscountAmount = 0,
      customer_profile_id,
      customer,
    } = parsed.data;
    const totalAmount = overrideTotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
    const claimToken = status === "PENDING_INFO" ? randomUUID() : null;
    const deductStock = status === "COMPLETED" || status === "PENDING_INFO";

    const orderNumber = generateOrderNumber();
    let totalCostAcc = 0;
    /** Collected inside the transaction; LINE alerts run after commit (must be in outer scope). */
    const postDeductionLowStockAlerts: { name: string; unitLabel: string; stock: number }[] = [];

    const { orderId: createdOrderId } = await prisma.$transaction(
      async (tx) => {
        const orderCreate: Prisma.ordersCreateInput = {
          order_number: orderNumber,
          total_amount: new Prisma.Decimal(totalAmount),
          total_cost: new Prisma.Decimal(0),
          shipping_fee: new Prisma.Decimal(0),
          discount_amount: new Prisma.Decimal(manualDiscountAmount),
          status,
          payment_status: status === "COMPLETED" ? "paid" : "pending",
          order_origin: "MANUAL",
          points_redeemed: points_redeemed,
          points_discount_amount: new Prisma.Decimal(points_discount_amount),
          promotion_rule_id: promotion_rule_id ? BigInt(promotion_rule_id) : null,
          promotion_discount_amount: new Prisma.Decimal(promotion_discount_amount),
          payment_method: status === "PENDING_INFO" ? "TRANSFER" : customer?.payment_method ?? null,
          claim_token: claimToken,
          shipping_address: customer?.address ?? null,
          customer_name: customer?.full_name ?? null,
          customer_phone: customer?.phone ?? null,
          customer_note: customer?.note ?? null,
        };
        if (customer_profile_id) {
          orderCreate.customer_profile = { connect: { id: BigInt(customer_profile_id) } };
        }
        const order = await tx.orders.create({ data: orderCreate });

        const uniqueVariantIds = [...new Set(items.map((i) => i.variantId))];
        const variants = await tx.product_variants.findMany({
          where: { id: { in: uniqueVariantIds.map((id) => BigInt(id)) } },
          select: {
            id: true,
            stock: true,
            cost_price: true,
            unit_label: true,
            low_stock_threshold: true,
            products: { select: { name: true } },
          },
        });
        const variantById = new Map(
          variants.map((v) => [Number(v.id), v] as const)
        );
        for (const id of uniqueVariantIds) {
          if (!variantById.has(id)) {
            throw new Error(`Variant ${id} not found`);
          }
        }

        const runningStock = new Map<number, number>();
        for (const v of variants) {
          runningStock.set(Number(v.id), v.stock ?? 0);
        }

        const linesToCreate: Prisma.order_itemsCreateManyInput[] = [];
        const decrementByVariant = new Map<number, number>();

        for (const item of items) {
          const variant = variantById.get(item.variantId)!;
          const currentStock = runningStock.get(item.variantId) ?? 0;
          if (deductStock && currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.productName} (${item.unitLabel}): need ${item.quantity}, have ${currentStock}`
            );
          }

          const lineTotal = item.price * item.quantity;
          const costPrice = Number(variant.cost_price ?? 0);
          totalCostAcc += costPrice * item.quantity;

          if (deductStock) {
            const afterStock = currentStock - item.quantity;
            runningStock.set(item.variantId, afterStock);
            const threshold = variant.low_stock_threshold ?? 5;
            if (afterStock <= threshold) {
              postDeductionLowStockAlerts.push({
                name: (variant.products as { name?: string })?.name ?? item.productName,
                unitLabel: variant.unit_label,
                stock: afterStock,
              });
            }
            decrementByVariant.set(
              item.variantId,
              (decrementByVariant.get(item.variantId) ?? 0) + item.quantity
            );
          }

          linesToCreate.push({
            order_id: order.id,
            variant_id: BigInt(item.variantId),
            product_id: BigInt(item.productId),
            product_name: item.productName,
            unit_label: item.unitLabel ?? null,
            quantity: item.quantity,
            unit_price: new Prisma.Decimal(item.price),
            unit_cost: new Prisma.Decimal(costPrice),
            total_price: new Prisma.Decimal(lineTotal),
            subtotal: new Prisma.Decimal(lineTotal),
          });
        }

        if (linesToCreate.length > 0) {
          await tx.order_items.createMany({ data: linesToCreate });
        }

        if (deductStock && decrementByVariant.size > 0) {
          const deductLines = [...decrementByVariant.entries()].map(([variantId, quantity]) => ({
            variantId,
            quantity,
          }));
          await deductVariantStockForOrderItems(tx, deductLines);
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
      },
      { timeout: 15_000 }
    );

    if (deductStock && postDeductionLowStockAlerts.length > 0) {
      void (async () => {
        for (const v of postDeductionLowStockAlerts) {
          const r = await sendLowStockAlert({ productName: v.name, unitLabel: v.unitLabel, stock: v.stock });
          if (!r.success) console.error("[orders/simple] LINE low stock alert:", r.error);
        }
      })();
    }

    return NextResponse.json(
      bigintToJson({
        orderNumber,
        status,
        orderId: createdOrderId,
        claimToken: claimToken ?? undefined,
      }),
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
