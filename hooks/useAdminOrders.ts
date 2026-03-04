import { useState, useEffect, useCallback } from "react";

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
      setOrders(data.orders ?? []);
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
