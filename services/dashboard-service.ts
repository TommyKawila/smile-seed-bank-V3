import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ServiceResult<T> = { data: T | null; error: string | null };

export interface FinancialSummary {
  totalRevenue: number;
  totalCOGS: number;
  netProfit: number;
  profitMarginPercent: number;
  totalOrders: number;
}

export interface RevenueDataPoint {
  date: string;   // "YYYY-MM-DD" or "YYYY-MM" for monthly
  revenue: number;
  cogs: number;
  profit: number;
}

export interface FinancialStatsPoint {
  date: string;
  revenue: number;
  profit: number;
}

export interface FinancialStats {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  netProfit: number;
  totalOrders: number;
  totalInventoryValue: number;
  series: FinancialStatsPoint[];
}

export interface ChannelBreakdown {
  channel: "WEB" | "MANUAL";
  orderCount: number;
  revenue: number;
}

export interface InventoryVariantRow {
  stock: number;
  cost_price: number;
  price: number;
  breeder_id: number | null;
  flowering_type: string | null;
  category: string | null;
  strain_dominance: string | null;
}

export interface InventoryValueResult {
  totalValue: number;
  lowStockCount: number;
  totalPotentialRevenue: number;
  potentialProfit: number;
  potentialMarginPercent: number;
  hasZeroCostWarning: boolean;
  variants: InventoryVariantRow[];
  breeders: { id: number; name: string }[];
}

export interface TopSpender {
  name: string;
  spent: number;
  orders: number;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function paidOrdersWhereSql(alias = "o", opts?: { from?: string; to?: string }) {
  const from = parseDate(opts?.from);
  const to = parseDate(opts?.to);
  const ref = Prisma.raw(alias);
  return Prisma.sql`
    (
      ${ref}.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
      OR (${ref}.status IN ('PENDING', 'PROCESSING') AND ${ref}.payment_status = 'paid')
    )
    ${from ? Prisma.sql`AND ${ref}.created_at >= ${from}` : Prisma.empty}
    ${to ? Prisma.sql`AND ${ref}.created_at <= ${to}` : Prisma.empty}
  `;
}

function financialStatsDays(startDate: Date, endDate: Date): string[] {
  const out: string[] = [];
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const last = new Date(endDate);
  last.setHours(0, 0, 0, 0);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export async function getFinancialStats(
  startDate: Date,
  endDate: Date
): Promise<ServiceResult<FinancialStats>> {
  try {
    const [ordersAgg, inventoryRows, seriesRows] = await Promise.all([
      prisma.orders.aggregate({
        where: {
          created_at: { gte: startDate, lte: endDate },
          status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
        },
        _sum: { total_amount: true, total_cost: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ total_inventory_value: string }[]>`
        SELECT COALESCE(SUM(COALESCE(cost_price, 0) * COALESCE(stock, 0)), 0)::text AS total_inventory_value
        FROM public.product_variants
      `,
      prisma.$queryRaw<{ date: string; revenue: string; cogs: string }[]>`
        SELECT
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
          COALESCE(SUM(total_amount), 0)::text AS revenue,
          COALESCE(SUM(total_cost), 0)::text AS cogs
        FROM public.orders
        WHERE created_at >= ${startDate}
          AND created_at <= ${endDate}
          AND status IN ('PAID', 'SHIPPED', 'COMPLETED')
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
      `,
    ]);

    const totalRevenue = Number(ordersAgg._sum.total_amount ?? 0);
    const totalCOGS = Number(ordersAgg._sum.total_cost ?? 0);
    const totalInventoryValue = Number(inventoryRows[0]?.total_inventory_value ?? 0);
    const seriesByDay = new Map(
      seriesRows.map((row) => {
        const revenue = Number(row.revenue ?? 0);
        const cogs = Number(row.cogs ?? 0);
        return [
          row.date,
          {
            date: row.date,
            revenue: Math.round(revenue * 100) / 100,
            profit: Math.round((revenue - cogs) * 100) / 100,
          },
        ];
      })
    );

    return {
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        grossProfit: Math.round((totalRevenue - totalCOGS) * 100) / 100,
        netProfit: Math.round((totalRevenue - totalCOGS) * 100) / 100,
        totalOrders: ordersAgg._count._all,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        series: financialStatsDays(startDate, endDate).map(
          (date) => seriesByDay.get(date) ?? { date, revenue: 0, profit: 0 }
        ),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Financial Summary ────────────────────────────────────────────────────────

export async function getFinancialSummary(opts?: {
  from?: string;  // ISO date string "YYYY-MM-DD"
  to?: string;
}): Promise<ServiceResult<FinancialSummary>> {
  try {
    const rows = await prisma.$queryRaw<
      { total_revenue: unknown; total_cogs: unknown; total_orders: bigint }[]
    >`
      WITH paid_orders AS (
        SELECT o.id, COALESCE(o.total_amount, 0)::numeric AS total_amount
        FROM public.orders o
        WHERE ${paidOrdersWhereSql("o", opts)}
      ),
      cogs AS (
        SELECT COALESCE(SUM(oi.quantity * COALESCE(NULLIF(oi.unit_cost, 0), pv.cost_price, 0)), 0)::numeric AS total_cogs
        FROM public.order_items oi
        INNER JOIN paid_orders po ON po.id = oi.order_id
        LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
      )
      SELECT
        COALESCE(SUM(po.total_amount), 0)::text AS total_revenue,
        (SELECT total_cogs::text FROM cogs) AS total_cogs,
        COUNT(*)::bigint AS total_orders
      FROM paid_orders po
    `;

    const row = rows[0];
    const totalRevenue = Number(row?.total_revenue ?? 0);
    const totalCOGS = Number(row?.total_cogs ?? 0);

    const netProfit = totalRevenue - totalCOGS;
    const profitMarginPercent =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      data: {
        totalRevenue,
        totalCOGS: Math.round(totalCOGS),
        netProfit,
        profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
        totalOrders: Number(row?.total_orders ?? 0),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Revenue Time Series (for Bar/Line Chart) ─────────────────────────────────

export async function getRevenueSeries(
  period: "daily" | "monthly" = "monthly",
  opts?: { from?: string; to?: string }
): Promise<ServiceResult<RevenueDataPoint[]>> {
  try {
    const bucket = period === "daily" ? "day" : "month";
    const rows = await prisma.$queryRaw<
      { date: string; revenue: unknown; cogs: unknown }[]
    >`
      WITH paid_orders AS (
        SELECT
          o.id,
          date_trunc(${bucket}, o.created_at)::date AS bucket_date,
          COALESCE(o.total_amount, 0)::numeric AS total_amount
        FROM public.orders o
        WHERE ${paidOrdersWhereSql("o", opts)}
      ),
      revenue AS (
        SELECT bucket_date, SUM(total_amount)::numeric AS revenue
        FROM paid_orders
        GROUP BY bucket_date
      ),
      cogs AS (
        SELECT
          po.bucket_date,
          COALESCE(SUM(oi.quantity * COALESCE(NULLIF(oi.unit_cost, 0), pv.cost_price, 0)), 0)::numeric AS cogs
        FROM paid_orders po
        LEFT JOIN public.order_items oi ON oi.order_id = po.id
        LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
        GROUP BY po.bucket_date
      )
      SELECT
        ${period === "daily"
          ? Prisma.sql`to_char(revenue.bucket_date, 'YYYY-MM-DD')`
          : Prisma.sql`to_char(revenue.bucket_date, 'YYYY-MM')`} AS date,
        revenue.revenue::text AS revenue,
        COALESCE(cogs.cogs, 0)::text AS cogs
      FROM revenue
      LEFT JOIN cogs ON cogs.bucket_date = revenue.bucket_date
      ORDER BY revenue.bucket_date ASC
    `;

    const series: RevenueDataPoint[] = rows.map((row) => {
      const revenue = Number(row.revenue ?? 0);
      const cogs = Number(row.cogs ?? 0);
      return {
        date: row.date,
        revenue: Math.round(revenue),
        cogs: Math.round(cogs),
        profit: Math.round(revenue - cogs),
      };
    });

    return { data: series, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Sales Channel Breakdown (for Pie Chart: WEB vs MANUAL) ──────────────────

export async function getSalesChannelBreakdown(opts?: {
  from?: string;
  to?: string;
}): Promise<ServiceResult<ChannelBreakdown[]>> {
  try {
    const rows = await prisma.$queryRaw<
      { channel: "WEB" | "MANUAL"; order_count: bigint; revenue: unknown }[]
    >`
      SELECT
        COALESCE(NULLIF(o.order_origin, ''), 'WEB')::text AS channel,
        COUNT(*)::bigint AS order_count,
        COALESCE(SUM(o.total_amount), 0)::text AS revenue
      FROM public.orders o
      WHERE ${paidOrdersWhereSql("o", opts)}
      GROUP BY COALESCE(NULLIF(o.order_origin, ''), 'WEB')
    `;
    const map = new Map(
      rows.map((r) => [
        r.channel,
        { count: Number(r.order_count), revenue: Number(r.revenue ?? 0) },
      ])
    );

    const result: ChannelBreakdown[] = (["WEB", "MANUAL"] as const).map(
      (ch) => ({
        channel: ch,
        orderCount: map.get(ch)?.count ?? 0,
        revenue: Math.round(map.get(ch)?.revenue ?? 0),
      })
    );

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function getTopSpenders(
  limit = 5,
  opts?: { from?: string; to?: string }
): Promise<ServiceResult<TopSpender[]>> {
  try {
    const rows = await prisma.$queryRaw<
      { name: string | null; spent: unknown; orders: bigint }[]
    >`
      WITH paid_orders AS (
        SELECT
          o.id,
          o.customer_id,
          o.customer_profile_id,
          o.customer_name,
          COALESCE(o.total_amount, 0)::numeric AS total_amount
        FROM public.orders o
        WHERE ${paidOrdersWhereSql("o", opts)}
      ),
      named AS (
        SELECT
          CASE
            WHEN po.customer_id IS NOT NULL THEN COALESCE(NULLIF(TRIM(c.full_name), ''), NULLIF(TRIM(po.customer_name), ''), 'Guest')
            WHEN po.customer_profile_id IS NOT NULL THEN COALESCE(NULLIF(TRIM(cp.name), ''), NULLIF(TRIM(po.customer_name), ''), 'POS')
            ELSE COALESCE(NULLIF(TRIM(po.customer_name), ''), 'Guest')
          END AS name,
          po.total_amount
        FROM paid_orders po
        LEFT JOIN public.customers c ON c.id = po.customer_id
        LEFT JOIN public."Customer" cp ON cp.id = po.customer_profile_id
      )
      SELECT name, SUM(total_amount)::text AS spent, COUNT(*)::bigint AS orders
      FROM named
      GROUP BY name
      ORDER BY SUM(total_amount) DESC
      LIMIT ${Math.min(50, Math.max(1, limit))}
    `;

    return {
      data: rows.map((row) => ({
        name: row.name?.trim() || "Guest",
        spent: Number(row.spent ?? 0),
        orders: Number(row.orders),
      })),
      error: null,
    };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Inventory Value ──────────────────────────────────────────────────────────

export async function getInventoryValue(): Promise<
  ServiceResult<InventoryValueResult>
> {
  try {
    const supabase = await createAdminClient();

    const selectWithDominance = "stock, cost_price, price, is_active, products(breeder_id, flowering_type, category, strain_dominance)";
    const selectWithoutDominance = "stock, cost_price, price, is_active, products(breeder_id, flowering_type, category)";

    let varData: unknown[] | null = null;
    let varErr: { message: string } | null = null;

    const res1 = await supabase
      .from("product_variants")
      .select(selectWithDominance)
      .eq("is_active", true);

    if (res1.error) {
      const msg = res1.error.message;
      if (/column.*does not exist|strain_dominance/i.test(msg)) {
        const res2 = await supabase
          .from("product_variants")
          .select(selectWithoutDominance)
          .eq("is_active", true);
        varData = res2.data;
        varErr = res2.error;
      } else {
        return { data: null, error: msg };
      }
    } else {
      varData = res1.data;
    }

    if (varErr) return { data: null, error: varErr.message };

    type Row = { stock: number; cost_price: number | null; price: number; products: { breeder_id: number | null; flowering_type: string | null; category: string | null; strain_dominance?: string | null } | null };
    const raw = (varData ?? []) as Row[];
    const variants: InventoryVariantRow[] = raw.map((v) => ({
      stock: v.stock ?? 0,
      cost_price: Number(v.cost_price) ?? 0,
      price: Number(v.price),
      breeder_id: v.products?.breeder_id != null ? Number(v.products.breeder_id) : null,
      flowering_type: v.products?.flowering_type ?? null,
      category: v.products?.category ?? null,
      strain_dominance: v.products?.strain_dominance ?? null,
    }));

    const { data: breedData, error: breedErr } = await supabase
      .from("breeders")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    const breeders = (breedErr ? [] : (breedData ?? [])) as { id: number; name: string }[];

    const totalValue = variants.reduce((s, v) => s + v.stock * v.cost_price, 0);
    const totalPotentialRevenue = variants.reduce((s, v) => s + v.stock * v.price, 0);
    const potentialProfit = totalPotentialRevenue - totalValue;
    const potentialMarginPercent =
      totalPotentialRevenue > 0 ? (potentialProfit / totalPotentialRevenue) * 100 : 0;
    const hasZeroCostWarning = variants.some(
      (v) => v.stock > 0 && v.cost_price === 0
    );
    const lowStockCount = variants.filter((v) => v.stock <= 5).length;

    return {
      data: {
        totalValue: Math.round(totalValue),
        lowStockCount,
        totalPotentialRevenue: Math.round(totalPotentialRevenue),
        potentialProfit: Math.round(potentialProfit),
        potentialMarginPercent: Math.round(potentialMarginPercent * 10) / 10,
        hasZeroCostWarning,
        variants,
        breeders,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

