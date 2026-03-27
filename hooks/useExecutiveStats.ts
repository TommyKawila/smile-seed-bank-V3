"use client";

import { useState, useEffect, useCallback } from "react";

export type ExecutiveStatsPayload = {
  range: { preset: string; start: string; end: string };
  metrics: {
    totalRevenue: number;
    totalShipping: number;
    totalDiscount: number;
    netProductRevenue: number;
    orderCount: number;
    conversionRate: number;
    quotationsTotal: number;
    quotationsConverted: number;
  };
  dailyTrend: { date: string; revenue: number; shipping: number; discount: number }[];
  topStrains: { name: string; breederName: string | null; quantity: number; revenue: number }[];
  topSpenders: { name: string; spent: number; orders: number }[];
  recentOrders: {
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string | null;
  }[];
};

export function useExecutiveStats(preset: "7" | "30" | "month") {
  const [data, setData] = useState<ExecutiveStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard/stats?range=${preset}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
      setData(j);
    } catch (e) {
      setError(String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
