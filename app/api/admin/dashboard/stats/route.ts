import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { dashboardRangeBounds } from "@/lib/dashboard-date-range";
import { ordersTableHasFeeColumns } from "@/lib/dashboard-order-fees";

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
    const preset = req.nextUrl.searchParams.get("range") ?? "30";
    const p = preset === "7" || preset === "month" ? preset : "30";
    const { start, end } = dashboardRangeBounds(p);
    const hasFeeCols = await ordersTableHasFeeColumns();

    const [agg] = hasFeeCols
      ? await prisma.$queryRaw<
          { revenue: unknown; shipping: unknown; discount: unknown; cnt: bigint }[]
        >`
          SELECT
            COALESCE(SUM(o.total_amount), 0)::text AS revenue,
            COALESCE(SUM(o.shipping_fee), 0)::text AS shipping,
            COALESCE(SUM(o.discount_amount), 0)::text AS discount,
            COUNT(*)::bigint AS cnt
          FROM public.orders o
          WHERE o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
            AND o.created_at >= ${start}
            AND o.created_at <= ${end}
        `
      : await prisma.$queryRaw<
          { revenue: unknown; shipping: unknown; discount: unknown; cnt: bigint }[]
        >`
          SELECT
            COALESCE(SUM(o.total_amount), 0)::text AS revenue,
            '0'::text AS shipping,
            '0'::text AS discount,
            COUNT(*)::bigint AS cnt
          FROM public.orders o
          WHERE o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
            AND o.created_at >= ${start}
            AND o.created_at <= ${end}
        `;

    const totalRevenue = toNum(agg?.revenue);
    const totalShipping = toNum(agg?.shipping);
    const totalDiscount = toNum(agg?.discount);
    const orderCount = Number(agg?.cnt ?? 0);
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

    const dailyRows = hasFeeCols
      ? await prisma.$queryRaw<
          { d: Date; revenue: unknown; shipping: unknown; discount: unknown }[]
        >`
          SELECT
            (o.created_at AT TIME ZONE 'UTC')::date AS d,
            COALESCE(SUM(o.total_amount), 0)::text AS revenue,
            COALESCE(SUM(o.shipping_fee), 0)::text AS shipping,
            COALESCE(SUM(o.discount_amount), 0)::text AS discount
          FROM public.orders o
          WHERE o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
            AND o.created_at >= ${start}
            AND o.created_at <= ${end}
          GROUP BY 1
          ORDER BY 1 ASC
        `
      : await prisma.$queryRaw<
          { d: Date; revenue: unknown; shipping: unknown; discount: unknown }[]
        >`
          SELECT
            (o.created_at AT TIME ZONE 'UTC')::date AS d,
            COALESCE(SUM(o.total_amount), 0)::text AS revenue,
            '0'::text AS shipping,
            '0'::text AS discount
          FROM public.orders o
          WHERE o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
            AND o.created_at >= ${start}
            AND o.created_at <= ${end}
          GROUP BY 1
          ORDER BY 1 ASC
        `;

    const byDay = new Map<string, { revenue: number; shipping: number; discount: number }>();
    for (const r of dailyRows) {
      const key = new Date(r.d).toISOString().slice(0, 10);
      byDay.set(key, {
        revenue: toNum(r.revenue),
        shipping: toNum(r.shipping),
        discount: toNum(r.discount),
      });
    }
    const days = eachDay(start, end);
    const dailyTrend = days.map((date) => {
      const x = byDay.get(date) ?? { revenue: 0, shipping: 0, discount: 0 };
      return { date, ...x };
    });

    // Top strains: LEFT JOIN products + breeders so breeder_name is null/empty when unlinked
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
        WHERE o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
          AND o.created_at >= ${start}
          AND o.created_at <= ${end}
      ) sub
      GROUP BY sub.grp_key
      ORDER BY SUM(sub.qty) DESC
      LIMIT 5
    `;

    const topStrains = strainRows.map((r) => ({
      name: r.product_name,
      breederName: (r.breeder_name ?? "").trim() || null, // always keyed; null = unknown breeder in UI
      quantity: Number(r.qty),
      revenue: toNum(r.rev),
    }));

    const webSpenders = await prisma.$queryRaw<
      { name: string | null; spent: unknown; orders: bigint }[]
    >`
      SELECT
        COALESCE(c.full_name, o.customer_name, 'Guest') AS name,
        SUM(o.total_amount)::text AS spent,
        COUNT(*)::bigint AS orders
      FROM public.orders o
      LEFT JOIN public.customers c ON c.id = o.customer_id
      WHERE o.customer_id IS NOT NULL
        AND o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
        AND o.created_at >= ${start}
        AND o.created_at <= ${end}
      GROUP BY o.customer_id, c.full_name, o.customer_name
      ORDER BY SUM(o.total_amount) DESC
      LIMIT 8
    `;

    const posSpenders = await prisma.$queryRaw<
      { name: string | null; spent: unknown; orders: bigint }[]
    >`
      SELECT
        COALESCE(cp.name, o.customer_name, 'POS') AS name,
        SUM(o.total_amount)::text AS spent,
        COUNT(*)::bigint AS orders
      FROM public.orders o
      LEFT JOIN "Customer" cp ON cp.id = o.customer_profile_id
      WHERE o.customer_id IS NULL
        AND o.customer_profile_id IS NOT NULL
        AND o.status IN ('PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED')
        AND o.created_at >= ${start}
        AND o.created_at <= ${end}
      GROUP BY o.customer_profile_id, cp.name, o.customer_name
      ORDER BY SUM(o.total_amount) DESC
      LIMIT 8
    `;

    type Sp = { name: string; spent: number; orders: number };
    const mergeMap = new Map<string, Sp>();
    for (const row of [...webSpenders, ...posSpenders]) {
      const name = (row.name ?? "Guest").trim() || "Guest";
      const spent = toNum(row.spent);
      const oc = Number(row.orders);
      const prev = mergeMap.get(name);
      if (prev) {
        mergeMap.set(name, { name, spent: prev.spent + spent, orders: prev.orders + oc });
      } else {
        mergeMap.set(name, { name, spent, orders: oc });
      }
    }
    const topSpenders = [...mergeMap.values()]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

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
          preset: p,
          start: start.toISOString(),
          end: end.toISOString(),
        },
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
