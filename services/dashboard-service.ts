import { createAdminClient } from "@/lib/supabase/server";
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

export interface InventoryValueResult {
  totalValue: number;         // sum(stock * cost_price)
  lowStockCount: number;      // variants with stock <= 5
}

// ─── Financial Summary ────────────────────────────────────────────────────────

export async function getFinancialSummary(opts?: {
  from?: string;  // ISO date string "YYYY-MM-DD"
  to?: string;
}): Promise<ServiceResult<FinancialSummary>> {
  try {
    const supabase = await createAdminClient();

    let query = supabase
      .from("orders")
      .select("total_amount, total_cost, status")
      .in("status", ["PAID", "SHIPPED"]); // Only count completed revenue

    if (opts?.from) query = query.gte("created_at", opts.from);
    if (opts?.to) query = query.lte("created_at", opts.to);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };

    const orders = data as Pick<Order, "total_amount" | "total_cost" | "status">[];

    const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
    const totalCOGS = orders.reduce((s, o) => s + o.total_cost, 0);
    const netProfit = totalRevenue - totalCOGS;
    const profitMarginPercent =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      data: {
        totalRevenue,
        totalCOGS,
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
    const supabase = await createAdminClient();

    let query = supabase
      .from("orders")
      .select("total_amount, total_cost, created_at")
      .in("status", ["PAID", "SHIPPED"])
      .order("created_at", { ascending: true });

    if (opts?.from) query = query.gte("created_at", opts.from);
    if (opts?.to) query = query.lte("created_at", opts.to);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };

    // Group by date key
    const map = new Map<string, { revenue: number; cogs: number }>();

    (data as Pick<Order, "total_amount" | "total_cost" | "created_at">[]).forEach(
      (order) => {
        const d = new Date(order.created_at);
        const key =
          period === "daily"
            ? d.toISOString().slice(0, 10)          // YYYY-MM-DD
            : d.toISOString().slice(0, 7);           // YYYY-MM

        const prev = map.get(key) ?? { revenue: 0, cogs: 0 };
        map.set(key, {
          revenue: prev.revenue + order.total_amount,
          cogs: prev.cogs + order.total_cost,
        });
      }
    );

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
    const supabase = await createAdminClient();

    let query = supabase
      .from("orders")
      .select("order_origin, total_amount")
      .in("status", ["PAID", "SHIPPED"]);

    if (opts?.from) query = query.gte("created_at", opts.from);
    if (opts?.to) query = query.lte("created_at", opts.to);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };

    const map = new Map<string, { count: number; revenue: number }>();

    (data as Pick<Order, "order_origin" | "total_amount">[]).forEach((o) => {
      const prev = map.get(o.order_origin) ?? { count: 0, revenue: 0 };
      map.set(o.order_origin, {
        count: prev.count + 1,
        revenue: prev.revenue + o.total_amount,
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

    const { data, error } = await supabase
      .from("product_variants")
      .select("stock, cost_price, is_active")
      .eq("is_active", true);

    if (error) return { data: null, error: error.message };

    const variants = data as Pick<
      ProductVariant,
      "stock" | "cost_price" | "is_active"
    >[];

    const totalValue = variants.reduce(
      (sum, v) => sum + v.stock * v.cost_price,
      0
    );

    const lowStockCount = variants.filter((v) => v.stock <= 5).length;

    return {
      data: {
        totalValue: Math.round(totalValue),
        lowStockCount,
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
