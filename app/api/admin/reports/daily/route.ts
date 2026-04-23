import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    const dateStr = toDateOnly(date);
    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    const where = {
      OR: [
        { status: { in: ["COMPLETED", "PAID", "SHIPPED"] } },
        { status: { in: ["PENDING", "PROCESSING"] }, payment_status: "paid" },
      ],
      created_at: { gte: startOfDay, lte: endOfDay },
    };

    const [orders, paymentAgg, pointsDiscount, pointsRedeemedRes, orderItems] = await Promise.all([
      prisma.orders.findMany({
        where,
        select: {
          id: true,
          order_number: true,
          customer_name: true,
          customer_phone: true,
          total_amount: true,
          payment_method: true,
          status: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.orders.groupBy({
        by: ["payment_method"],
        where,
        _sum: { total_amount: true },
      }),
      prisma.orders.aggregate({
        where,
        _sum: { points_discount_amount: true },
      }),
      prisma.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`SELECT COALESCE(SUM(points_redeemed), 0)::bigint as total FROM orders WHERE (
          (status IN ('PENDING', 'PROCESSING') AND payment_status = 'paid') OR status IN ('COMPLETED','PAID','SHIPPED')
        ) AND created_at >= ${startOfDay} AND created_at <= ${endOfDay}`
      ),
      prisma.order_items.findMany({
        where: { orders: { ...where } },
        select: { product_name: true, quantity: true },
      }),
    ]);

    const totalSales = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
    const paymentBreakdown: Record<string, number> = {};
    paymentAgg.forEach((p) => {
      const key = p.payment_method ?? "OTHER";
      paymentBreakdown[key] = Number(p._sum.total_amount ?? 0);
    });

    const topProducts = (() => {
      const map = new Map<string, number>();
      orderItems.forEach((i) => {
        map.set(i.product_name, (map.get(i.product_name) ?? 0) + i.quantity);
      });
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([product_name, quantity]) => ({ product_name, quantity }));
    })();

    const payload = {
      date: dateStr,
      totalSales,
      orderCount: orders.length,
      paymentBreakdown,
      pointsDiscountAmount: Number(pointsDiscount._sum.points_discount_amount ?? 0),
      pointsRedeemed: Number(pointsRedeemedRes[0]?.total ?? 0),
      wholesaleDiscountAmount: 0,
      orders: orders.map((o) => ({
        id: String(o.id),
        order_number: o.order_number,
        customer_name: o.customer_name ?? "—",
        customer_phone: o.customer_phone ?? null,
        total_amount: Number(o.total_amount),
        payment_method: o.payment_method,
        status: o.status,
        created_at: o.created_at?.toISOString() ?? null,
      })),
      topProducts,
    };

    return NextResponse.json(bigintToJson(payload));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
