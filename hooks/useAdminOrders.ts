import { useState, useEffect, useCallback } from "react";
import type { AdminOrderLineItem } from "@/types/admin-order";
import type { OrderListTabCounts } from "@/services/orders-service";

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string | null;
  /** unpaid | paid */
  payment_status: string;
  status: string;
  slip_url: string | null;
  reject_note: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  created_at: string;
  /** LINE Messaging API user id — order or linked customer */
  line_user_id: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  customer_note: string | null;
  customer_id: string | null;
  customer_email: string | null;
  discount_amount: number;
  points_discount_amount: number;
  promotion_discount_amount: number;
  line_items: AdminOrderLineItem[];
}

export type UseAdminOrdersOptions = {
  /** Workflow tab: waiting | paid | shipped | completed | cancelled — omit or "" for all (limit 200) */
  statusTab?: string;
  dateRange?: string;
  /** Server-side counts for all tabs (desktop dashboard) */
  includeTabCounts?: boolean;
};

export function useAdminOrders(options?: UseAdminOrdersOptions) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState<OrderListTabCounts | null>(null);

  const statusTab = options?.statusTab;
  const dateRange = options?.dateRange;
  const includeTabCounts = options?.includeTabCounts ?? false;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusTab && statusTab.length > 0) {
        params.set("statusTab", statusTab);
      }
      if (dateRange) {
        params.set("dateRange", dateRange);
      }
      if (includeTabCounts) {
        params.set("includeTabCounts", "1");
      }
      const q = params.toString();
      const res = await fetch(q ? `/api/admin/orders?${q}` : "/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      const list = data.orders ?? [];
      setOrders(
        list.map((o: AdminOrder) => ({
          ...o,
          customer_note: o.customer_note ?? null,
          payment_status: (o as { payment_status?: string }).payment_status ?? "unpaid",
          line_items: o.line_items ?? [],
          discount_amount: Number(o.discount_amount ?? 0),
          points_discount_amount: Number(o.points_discount_amount ?? 0),
          promotion_discount_amount: Number(o.promotion_discount_amount ?? 0),
        }))
      );
      setTabCounts(
        data.tabCounts && typeof data.tabCounts === "object"
          ? (data.tabCounts as OrderListTabCounts)
          : null
      );
    } catch (err) {
      setError(String(err));
      setOrders([]);
      setTabCounts(null);
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, dateRange, includeTabCounts]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders, tabCounts };
}
