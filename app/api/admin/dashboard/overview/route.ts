import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dashboardRangeBounds } from "@/lib/dashboard-date-range";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "COMPLETED", "SHIPPED", "DELIVERED"] as const;

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

function bucketOrderUser(o: {
  customer_id: string | null;
  customers: { email: string | null; line_user_id: string | null } | null;
}): "guest" | "line" | "google" {
  if (!o.customer_id || !o.customers) return "guest";
  const em = (o.customers.email ?? "").toLowerCase();
  if (em.includes("line.smileseedbank.local")) return "line";
  if (o.customers.line_user_id?.trim()) return "line";
  return "google";
}

export async function GET(req: NextRequest) {
  try {
    const preset = req.nextUrl.searchParams.get("range") ?? "30";
    const p = preset === "7" || preset === "month" ? preset : "30";
    const { start, end } = dashboardRangeBounds(p);

    const orderWherePaid = {
      status: { in: [...PAID_STATUSES] },
      created_at: { gte: start, lte: end },
    };

    const [salesAgg, ordersForVolume, ordersForPie, newCustomersCount] = await Promise.all([
      prisma.orders.aggregate({
        where: orderWherePaid,
        _sum: { total_amount: true },
        _count: { _all: true },
      }),
      prisma.orders.findMany({
        where: { created_at: { gte: start, lte: end } },
        select: { created_at: true },
      }),
      prisma.orders.findMany({
        where: orderWherePaid,
        select: {
          customer_id: true,
          customers: { select: { email: true, line_user_id: true } },
        },
      }),
      prisma.customers.count({
        where: { created_at: { gte: start, lte: end } },
      }),
    ]);

    let topSearches: { term: string; count: number }[] = [];
    try {
      const topSearchRows = await prisma.$queryRaw<{ term: string; c: bigint }[]>`
        SELECT lower(trim(term)) AS term, COUNT(*)::bigint AS c
        FROM search_logs
        WHERE created_at >= ${start}
          AND created_at <= ${end}
          AND length(trim(term)) > 0
        GROUP BY lower(trim(term))
        ORDER BY c DESC
        LIMIT 5
      `;
      topSearches = topSearchRows.map((r) => ({
        term: r.term,
        count: Number(r.c),
      }));
    } catch (e) {
      console.warn("[dashboard/overview] search_logs unavailable:", e);
    }

    const totalSalesThb = Number(salesAgg._sum.total_amount ?? 0);
    const totalOrdersPaid = salesAgg._count._all;

    const volByDay = new Map<string, number>();
    for (const o of ordersForVolume) {
      if (!o.created_at) continue;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      volByDay.set(key, (volByDay.get(key) ?? 0) + 1);
    }
    const days = eachDay(start, end);
    const orderVolumeByDay = days.map((date) => ({
      date,
      orders: volByDay.get(date) ?? 0,
    }));

    let guest = 0;
    let line = 0;
    let google = 0;
    for (const o of ordersForPie) {
      const b = bucketOrderUser(o);
      if (b === "guest") guest++;
      else if (b === "line") line++;
      else google++;
    }

    const userTypePie = [
      { name: "Guest", value: guest, fill: "#a1a1aa" },
      { name: "LINE login", value: line, fill: "#06C755" },
      { name: "Google login", value: google, fill: "#4285F4" },
    ].filter((x) => x.value > 0);

    return NextResponse.json({
      range: {
        preset: p,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalSalesThb,
      totalOrders: totalOrdersPaid,
      newCustomers: newCustomersCount,
      orderVolumeByDay,
      userTypePie,
      topSearches,
    });
  } catch (e) {
    console.error("[dashboard/overview]", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
