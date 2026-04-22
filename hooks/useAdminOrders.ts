import { useState, useEffect, useCallback } from "react";
import type { AdminOrderLineItem } from "@/types/admin-order";

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string | null;
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
  customer_id: string | null;
  customer_email: string | null;
  discount_amount: number;
  points_discount_amount: number;
  promotion_discount_amount: number;
  line_items: AdminOrderLineItem[];
}

export function useAdminOrders(statusFilter?: string) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = statusFilter
        ? `/api/admin/orders?status=${encodeURIComponent(statusFilter)}`
        : "/api/admin/orders";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      const list = data.orders ?? [];
      setOrders(
        list.map((o) => ({
          ...o,
          line_items: o.line_items ?? [],
          discount_amount: Number(o.discount_amount ?? 0),
          points_discount_amount: Number(o.points_discount_amount ?? 0),
          promotion_discount_amount: Number(o.promotion_discount_amount ?? 0),
        }))
      );
    } catch (err) {
      setError(String(err));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}
