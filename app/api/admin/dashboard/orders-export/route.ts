import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { dashboardRangeBounds } from "@/lib/dashboard-date-range";
import { ordersTableHasFeeColumns } from "@/lib/dashboard-order-fees";
import { prismaWhereOrderPaymentConfirmed } from "@/lib/order-paid";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const preset = req.nextUrl.searchParams.get("range") ?? "30";
    const p = preset === "7" || preset === "month" ? preset : "30";
    const { start, end } = dashboardRangeBounds(p);
    const hasFeeCols = await ordersTableHasFeeColumns();

    const baseSelect = {
      created_at: true,
      order_number: true,
      customer_name: true,
      order_origin: true,
      total_amount: true,
      _count: { select: { order_items: true } },
    } as const;

    const rows = hasFeeCols
      ? await prisma.orders.findMany({
          where: {
            created_at: { gte: start, lte: end },
            ...prismaWhereOrderPaymentConfirmed,
          },
          orderBy: { created_at: "asc" },
          select: {
            ...baseSelect,
            shipping_fee: true,
            discount_amount: true,
          },
        })
      : await prisma.orders.findMany({
          where: {
            created_at: { gte: start, lte: end },
            ...prismaWhereOrderPaymentConfirmed,
          },
          orderBy: { created_at: "asc" },
          select: { ...baseSelect },
        });

    const orders = rows.map((o) => {
      const total = Number(o.total_amount);
      const ship = hasFeeCols ? Number((o as { shipping_fee?: unknown }).shipping_fee ?? 0) : 0;
      const disc = hasFeeCols ? Number((o as { discount_amount?: unknown }).discount_amount ?? 0) : 0;
      const subtotal = total - ship + disc;
      const origin = (o.order_origin ?? "WEB").toUpperCase();
      const channel = origin === "MANUAL" ? "POS" : "Web";
      return {
        orderDate: o.created_at?.toISOString() ?? null,
        orderNumber: o.order_number,
        customerName: o.customer_name?.trim() || "—",
        channel,
        lineCount: o._count.order_items,
        subtotal,
        shippingFee: ship,
        discountAmount: disc,
        totalAmount: total,
      };
    });

    return NextResponse.json(bigintToJson({ range: p, orders }));
  } catch (e) {
    console.error("[orders-export]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
