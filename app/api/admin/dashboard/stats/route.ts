import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { dashboardRangeBounds } from "@/lib/dashboard-date-range";
import { ordersTableHasFeeColumns } from "@/lib/dashboard-order-fees";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "COMPLETED", "SHIPPED", "DELIVERED"] as const;

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

    const orderWherePaidInRange = {
      status: { in: [...PAID_STATUSES] },
      created_at: { gte: start, lte: end },
    };

    const aggResult = await prisma.orders.aggregate({
      where: orderWherePaidInRange,
      _sum: hasFeeCols
        ? { total_amount: true, shipping_fee: true, discount_amount: true }
        : { total_amount: true },
      _count: { _all: true },
    });

    const totalRevenue = Number(aggResult._sum.total_amount ?? 0);
    const totalShipping = hasFeeCols ? Number(aggResult._sum.shipping_fee ?? 0) : 0;
    const totalDiscount = hasFeeCols ? Number(aggResult._sum.discount_amount ?? 0) : 0;
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
      breederName: (r.breeder_name ?? "").trim() || null,
      quantity: Number(r.qty),
      revenue: toNum(r.rev),
    }));

    const [webOrders, posOrders] = await Promise.all([
      prisma.orders.findMany({
        where: {
          ...orderWherePaidInRange,
          customer_id: { not: null },
        },
        include: { customers: true },
      }),
      prisma.orders.findMany({
        where: {
          ...orderWherePaidInRange,
          customer_id: null,
          customer_profile_id: { not: null },
        },
        include: { customer_profile: true },
      }),
    ]);

    type SpRow = { name: string | null; spent: unknown; orders: bigint };
    const webSpenders: SpRow[] = [];
    const webByCustomer = new Map<
      string,
      { name: string; spent: number; orders: number }
    >();
    for (const o of webOrders) {
      const cid = o.customer_id;
      if (!cid) continue;
      const name =
        (o.customers?.full_name?.trim() ||
          o.customer_name?.trim() ||
          "Guest") || "Guest";
      const spent = Number(o.total_amount ?? 0);
      const prev = webByCustomer.get(cid);
      if (prev) {
        webByCustomer.set(cid, {
          name: prev.name,
          spent: prev.spent + spent,
          orders: prev.orders + 1,
        });
      } else {
        webByCustomer.set(cid, { name, spent, orders: 1 });
      }
    }
    for (const v of webByCustomer.values()) {
      webSpenders.push({
        name: v.name,
        spent: v.spent,
        orders: BigInt(v.orders),
      });
    }
    webSpenders.sort((a, b) => toNum(b.spent) - toNum(a.spent));
    const webTop = webSpenders.slice(0, 8);

    const posSpenders: SpRow[] = [];
    const posByProfile = new Map<
      string,
      { name: string; spent: number; orders: number }
    >();
    for (const o of posOrders) {
      const pid = o.customer_profile_id;
      if (pid == null) continue;
      const key = String(pid);
      const name =
        (o.customer_profile?.name?.trim() ||
          o.customer_name?.trim() ||
          "POS") || "POS";
      const spent = Number(o.total_amount ?? 0);
      const prev = posByProfile.get(key);
      if (prev) {
        posByProfile.set(key, {
          name: prev.name,
          spent: prev.spent + spent,
          orders: prev.orders + 1,
        });
      } else {
        posByProfile.set(key, { name, spent, orders: 1 });
      }
    }
    for (const v of posByProfile.values()) {
      posSpenders.push({
        name: v.name,
        spent: v.spent,
        orders: BigInt(v.orders),
      });
    }
    posSpenders.sort((a, b) => toNum(b.spent) - toNum(a.spent));
    const posTop = posSpenders.slice(0, 8);

    type Sp = { name: string; spent: number; orders: number };
    const mergeMap = new Map<string, Sp>();
    for (const row of [...webTop, ...posTop]) {
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
