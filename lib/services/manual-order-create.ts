import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { sendLowStockAlert } from "@/services/line-messaging";

export type ManualDeductItem = {
  variantId: number;
  productId: number;
  productName: string;
  unitLabel: string;
  quantity: number;
  /** Revenue per unit (after line discount: lineTotal / qty) */
  unitPrice: number;
};

export type ManualOrderCustomer = {
  full_name?: string;
  phone?: string;
  address?: string;
  payment_method?: string;
  note?: string;
  /** public.customers.id (UUID) when matched */
  customerId?: string | null;
  /** Customer (POS) BigInt id when matched */
  customerProfileId?: bigint | number | null;
};

export async function createManualOrderFromItems(input: {
  items: ManualDeductItem[];
  /** items subtotal + shipping_fee - discount_amount (defaults computed from lines + fees) */
  total_amount?: number;
  shipping_fee?: number;
  discount_amount?: number;
  /** When set (e.g. from quotation convert), used as DB order_number */
  order_number?: string | null;
  /** Original quotation number for receipt PDF naming */
  source_quotation_number?: string | null;
  customer?: ManualOrderCustomer;
}): Promise<{ orderNumber: string; orderId: bigint }> {
  const { items, customer } = input;
  const itemsRevenue = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shipping_fee = Math.max(0, input.shipping_fee ?? 0);
  const discount_amount = Math.max(0, input.discount_amount ?? 0);
  const total_amount =
    input.total_amount ?? itemsRevenue + shipping_fee - discount_amount;
  const customNo = input.order_number?.trim();
  const orderNumber = customNo && customNo.length > 0 ? customNo : generateOrderNumber();
  let totalCostAcc = 0;

  const orderId = await prisma.$transaction(async (tx) => {
    const profileId =
      customer?.customerProfileId != null ? BigInt(customer.customerProfileId) : null;

    const orderCreate: Prisma.ordersCreateInput = {
      order_number: orderNumber,
      source_quotation_number: input.source_quotation_number?.trim() ?? null,
      total_amount: new Prisma.Decimal(total_amount),
      total_cost: new Prisma.Decimal(0),
      shipping_fee: new Prisma.Decimal(shipping_fee),
      discount_amount: new Prisma.Decimal(discount_amount),
      status: "COMPLETED",
      order_origin: "MANUAL",
      payment_method: customer?.payment_method ?? "CASH",
      shipping_address: customer?.address ?? null,
      customer_name: customer?.full_name ?? null,
      customer_phone: customer?.phone ?? null,
      customer_note: customer?.note ?? null,
    };
    const webCust = customer?.customerId?.trim();
    if (webCust) {
      orderCreate.customers = { connect: { id: webCust } };
    }
    if (profileId) {
      orderCreate.customer_profile = { connect: { id: profileId } };
    }

    const order = await tx.orders.create({ data: orderCreate });

    const postDeductionLowStockAlerts: { name: string; unitLabel: string; stock: number }[] = [];

    for (const item of items) {
      const variant = await tx.product_variants.findUnique({
        where: { id: BigInt(item.variantId) },
        select: {
          stock: true,
          cost_price: true,
          unit_label: true,
          low_stock_threshold: true,
          products: { select: { name: true } },
        },
      });
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);
      const currentStock = variant.stock ?? 0;
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productName} (${item.unitLabel}): need ${item.quantity}, have ${currentStock}`
        );
      }

      const lineTotal = item.unitPrice * item.quantity;
      const costPrice = Number(variant.cost_price ?? 0);
      totalCostAcc += costPrice * item.quantity;

      const afterStock = currentStock - item.quantity;
      const threshold = variant.low_stock_threshold ?? 5;
      if (afterStock <= threshold) {
        postDeductionLowStockAlerts.push({
          name: (variant.products as { name?: string })?.name ?? item.productName,
          unitLabel: variant.unit_label,
          stock: afterStock,
        });
      }

      const lineCreate: Prisma.order_itemsCreateInput = {
        orders: { connect: { id: order.id } },
        variant_id: BigInt(item.variantId),
        product_id: BigInt(item.productId),
        product_name: item.productName,
        unit_label: item.unitLabel ?? null,
        quantity: item.quantity,
        unit_price: new Prisma.Decimal(item.unitPrice),
        unit_cost: new Prisma.Decimal(costPrice),
        total_price: new Prisma.Decimal(lineTotal),
        subtotal: new Prisma.Decimal(lineTotal),
      };
      await tx.order_items.create({ data: lineCreate });

      await tx.product_variants.update({
        where: { id: BigInt(item.variantId) },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.orders.update({
      where: { id: order.id },
      data: { total_cost: new Prisma.Decimal(totalCostAcc) },
    });

    if (postDeductionLowStockAlerts.length > 0) {
      void (async () => {
        for (const v of postDeductionLowStockAlerts) {
          const r = await sendLowStockAlert({
            productName: v.name,
            unitLabel: v.unitLabel,
            stock: v.stock,
          });
          if (!r.success) console.error("[manual-order-create] LINE low stock alert:", r.error);
        }
      })();
    }

    return order.id;
  });

  return { orderNumber, orderId };
}
