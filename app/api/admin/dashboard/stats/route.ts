import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { assertAdmin } from "@/lib/auth-utils";
import { dashboardRangeBounds } from "@/lib/dashboard-date-range";
import { ordersTableHasFeeColumns } from "@/lib/dashboard-order-fees";
import { prismaWhereOrderPaymentConfirmed } from "@/lib/order-paid";
import { getFinancialStats, getTopSpenders } from "@/services/dashboard-service";

export const dynamic = "force-dynamic";

function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function eachDay(start: Date, end: Date): string[] {
  const out: string[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
    const preset = req.nextUrl.searchParams.get("range") ?? "30";
    const p = preset === "7" || preset === "7d" ? "7" : preset === "month" ? "month" : "30";
    const { start, end } = dashboardRangeBounds(p);
    const hasFeeCols = await ordersTableHasFeeColumns();

    const orderWherePaidInRange = {
      created_at: { gte: start, lte: end },
      ...prismaWhereOrderPaymentConfirmed,
    };

    const aggResult = await prisma.orders.aggregate({
      where: orderWherePaidInRange,
      _sum: hasFeeCols
        ? { total_amount: true, shipping_fee: true, discount_amount: true }
        : { total_amount: true },
      _count: { _all: true },
    });

    const totalRevenue = Number(aggResult._sum.total_amount ?? 0);
    const feeSum = aggResult._sum as {
      shipping_fee?: unknown;
      discount_amount?: unknown;
    };
    const totalShipping = hasFeeCols ? Number(feeSum.shipping_fee ?? 0) : 0;
    const totalDiscount = hasFeeCols ? Number(feeSum.discount_amount ?? 0) : 0;
    const orderCount = aggResult._count._all;
    const netProductRevenue = totalRevenue - totalShipping + totalDiscount;

    const [qTotal, qConv] = await Promise.all([
      prisma.quotations.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.quotations.count({
        where: {
          createdAt: { gte: start, lte: end },
          convertedOrderId: { not: null },
        },
      }),
    ]);
    const conversionRate = qTotal > 0 ? (qConv / qTotal) * 100 : 0;

    const trendOrders = await prisma.orders.findMany({
      where: orderWherePaidInRange,
      select: hasFeeCols
        ? {
            created_at: true,
            total_amount: true,
            shipping_fee: true,
            discount_amount: true,
          }
        : {
            created_at: true,
            total_amount: true,
          },
    });

    const byDay = new Map<string, { revenue: number; shipping: number; discount: number }>();
    for (const o of trendOrders) {
      if (!o.created_at) continue;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      const row = byDay.get(key) ?? { revenue: 0, shipping: 0, discount: 0 };
      row.revenue += Number(o.total_amount ?? 0);
      if (hasFeeCols && "shipping_fee" in o && "discount_amount" in o) {
        row.shipping += Number(o.shipping_fee ?? 0);
        row.discount += Number(o.discount_amount ?? 0);
      }
      byDay.set(key, row);
    }
    const days = eachDay(start, end);
    const dailyTrend = days.map((date) => {
      const x = byDay.get(date) ?? { revenue: 0, shipping: 0, discount: 0 };
      return { date, ...x };
    });

    const strainRows = await prisma.$queryRaw<
      { product_name: string; breeder_name: string | null; qty: bigint; rev: unknown }[]
    >`
      SELECT
        MAX(sub.display_name) AS product_name,
        MAX(sub.breeder_name) AS breeder_name,
        SUM(sub.qty)::bigint AS qty,
        COALESCE(SUM(sub.rev), 0)::text AS rev
      FROM (
        SELECT
          COALESCE(p.name, oi.product_name) AS display_name,
          COALESCE(b.name, '') AS breeder_name,
          oi.quantity::bigint AS qty,
          COALESCE(oi.total_price, 0)::numeric AS rev,
          CASE
            WHEN oi.product_id IS NOT NULL THEN 'id:' || oi.product_id::text
            ELSE 'name:' || oi.product_name
          END AS grp_key
        FROM public.order_items oi
        INNER JOIN public.orders o ON o.id = oi.order_id
        LEFT JOIN public.products p ON p.id = oi.product_id
        LEFT JOIN public.breeders b ON b.id = p.breeder_id
        WHERE (
            (o.status IN ('PENDING', 'PROCESSING') AND o.payment_status = 'paid')
            OR o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
          )
          AND o.created_at >= ${start}
          AND o.created_at <= ${end}
      ) sub
      GROUP BY sub.grp_key
      ORDER BY SUM(sub.qty) DESC
      LIMIT 5
    `;

    const topStrains = strainRows.map((r) => ({
      name: r.product_name,
      breederName: (r.breeder_name ?? "").trim() || null,
      quantity: Number(r.qty),
      revenue: toNum(r.rev),
    }));

    const topSpendersResult = await getTopSpenders(5, {
      from: start.toISOString(),
      to: end.toISOString(),
    });
    const topSpenders = topSpendersResult.data ?? [];
    const financialResult = await getFinancialStats(start, end);
    if (financialResult.error || !financialResult.data) {
      throw new Error(financialResult.error ?? "Failed to load financial stats");
    }

    const recentOrders = await prisma.orders.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        order_number: true,
        status: true,
        total_amount: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      bigintToJson({
        range: {
          preset: p === "7" ? "7d" : "30d",
          start: start.toISOString(),
          end: end.toISOString(),
        },
        ...financialResult.data,
        metrics: {
          totalRevenue,
          totalShipping,
          totalDiscount,
          netProductRevenue,
          orderCount,
          conversionRate,
          quotationsTotal: qTotal,
          quotationsConverted: qConv,
        },
        dailyTrend,
        topStrains,
        topSpenders,
        recentOrders: recentOrders.map((o) => ({
          orderNumber: o.order_number,
          status: o.status ?? "—",
          totalAmount: Number(o.total_amount),
          createdAt: o.created_at?.toISOString() ?? null,
        })),
      })
    );
  } catch (e) {
    console.error("[dashboard/stats]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
