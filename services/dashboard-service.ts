import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Order, OrderItem, ProductVariant } from "@/types/supabase";

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

// ─── Financial Summary ────────────────────────────────────────────────────────

export async function getFinancialSummary(opts?: {
  from?: string;  // ISO date string "YYYY-MM-DD"
  to?: string;
}): Promise<ServiceResult<FinancialSummary>> {
  try {
    const where: { OR: object[]; created_at?: object } = {
      OR: [
        { status: { in: ["PAID", "SHIPPED"] } },
        { status: { in: ["PENDING", "PROCESSING"] }, payment_status: "paid" },
      ],
    };
    if (opts?.from || opts?.to) {
      where.created_at = {};
      if (opts.from) (where.created_at as Record<string, Date>).gte = new Date(opts.from);
      if (opts.to) (where.created_at as Record<string, Date>).lte = new Date(opts.to);
    }

    const orders = await prisma.orders.findMany({
      where,
      select: { id: true, total_amount: true, total_cost: true },
    });

    const orderIds = orders.map((o) => o.id);
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);

    // COGS from order_items: quantity * (unit_cost ?? variant.cost_price)
    let totalCOGS = 0;
    if (orderIds.length > 0) {
      const items = await prisma.order_items.findMany({
        where: { order_id: { in: orderIds } },
        select: { variant_id: true, quantity: true, unit_cost: true },
      });
      const variantIds = [...new Set(items.map((i) => i.variant_id).filter(Boolean))] as bigint[];
      const variantCosts = variantIds.length
        ? await prisma.product_variants.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, cost_price: true },
          })
        : [];
      const costMap = new Map(variantCosts.map((v) => [Number(v.id), Number(v.cost_price ?? 0)]));
      for (const item of items) {
        const cost = item.unit_cost != null && Number(item.unit_cost) > 0
          ? Number(item.unit_cost)
          : (item.variant_id ? costMap.get(Number(item.variant_id)) ?? 0 : 0);
        totalCOGS += item.quantity * cost;
      }
    }

    const netProfit = totalRevenue - totalCOGS;
    const profitMarginPercent =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      data: {
        totalRevenue,
        totalCOGS: Math.round(totalCOGS),
        netProfit,
        profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
        totalOrders: orders.length,
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
    const where: { OR: object[]; created_at?: object } = {
      OR: [
        { status: { in: ["PAID", "SHIPPED"] } },
        { status: { in: ["PENDING", "PROCESSING"] }, payment_status: "paid" },
      ],
    };
    if (opts?.from || opts?.to) {
      where.created_at = {};
      if (opts.from) (where.created_at as Record<string, Date>).gte = new Date(opts.from);
      if (opts.to) (where.created_at as Record<string, Date>).lte = new Date(opts.to);
    }

    const orders = await prisma.orders.findMany({
      where,
      select: { id: true, total_amount: true, created_at: true },
      orderBy: { created_at: "asc" },
    });

    const map = new Map<string, { revenue: number; cogs: number }>();

    if (orders.length > 0) {
      const items = await prisma.order_items.findMany({
        where: { order_id: { in: orders.map((o) => o.id) } },
        select: { order_id: true, variant_id: true, quantity: true, unit_cost: true },
      });
      const variantIds = [...new Set(items.map((i) => i.variant_id).filter(Boolean))] as bigint[];
      const variantCosts = variantIds.length
        ? await prisma.product_variants.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, cost_price: true },
          })
        : [];
      const costMap = new Map(variantCosts.map((v) => [Number(v.id), Number(v.cost_price ?? 0)]));

      const orderCogsMap = new Map<bigint, number>();
      for (const item of items) {
        const cost = item.unit_cost != null && Number(item.unit_cost) > 0
          ? Number(item.unit_cost)
          : (item.variant_id ? costMap.get(Number(item.variant_id)) ?? 0 : 0);
        const add = item.quantity * cost;
        orderCogsMap.set(item.order_id!, (orderCogsMap.get(item.order_id!) ?? 0) + add);
      }

      for (const order of orders) {
        const d = new Date(order.created_at!);
        const key = period === "daily" ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7);
        const prev = map.get(key) ?? { revenue: 0, cogs: 0 };
        map.set(key, {
          revenue: prev.revenue + Number(order.total_amount),
          cogs: prev.cogs + (orderCogsMap.get(order.id) ?? 0),
        });
      }
    }

    const series: RevenueDataPoint[] = Array.from(map.entries()).map(
      ([date, v]) => ({
        date,
        revenue: Math.round(v.revenue),
        cogs: Math.round(v.cogs),
        profit: Math.round(v.revenue - v.cogs),
      })
    );

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
    const created_at: { gte?: Date; lte?: Date } = {};
    if (opts?.from) created_at.gte = new Date(opts.from);
    if (opts?.to) created_at.lte = new Date(opts.to);
    const hasDate = created_at.gte != null || created_at.lte != null;

    const data = await prisma.orders.findMany({
      where: {
        ...(hasDate ? { created_at } : {}),
        OR: [
          { status: { in: ["PAID", "SHIPPED"] } },
          { status: { in: ["PENDING", "PROCESSING"] }, payment_status: "paid" },
        ],
      },
      select: { order_origin: true, total_amount: true },
    });

    const map = new Map<string, { count: number; revenue: number }>();

    data.forEach((o) => {
      const ch = o.order_origin ?? "WEB";
      const prev = map.get(ch) ?? { count: 0, revenue: 0 };
      map.set(ch, {
        count: prev.count + 1,
        revenue: prev.revenue + Number(o.total_amount),
      });
    });

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

// ─── Top Selling Variants (for Admin overview table) ─────────────────────────

export async function getTopSellingVariants(
  limit = 10
): Promise<ServiceResult<{ variantId: number; unitsSold: number; revenue: number }[]>> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("order_items")
      .select("variant_id, quantity, unit_price")
      .limit(1000); // Fetch recent items — aggregate in JS

    if (error) return { data: null, error: error.message };

    const items = data as Pick<OrderItem, "variant_id" | "quantity" | "unit_price">[];

    const map = new Map<number, { unitsSold: number; revenue: number }>();

    items.forEach((item) => {
      const prev = map.get(item.variant_id) ?? { unitsSold: 0, revenue: 0 };
      map.set(item.variant_id, {
        unitsSold: prev.unitsSold + item.quantity,
        revenue: prev.revenue + item.quantity * item.unit_price,
      });
    });

    const sorted = Array.from(map.entries())
      .map(([variantId, v]) => ({ variantId, ...v }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);

    return { data: sorted, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}
