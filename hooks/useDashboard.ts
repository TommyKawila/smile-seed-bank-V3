"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import type {
  FinancialSummary,
  RevenueDataPoint,
  ChannelBreakdown,
  InventoryValueResult,
} from "@/services/dashboard-service";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

// Validate date range input before fetching
const DateRangeSchema = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD")
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD")
      .optional(),
  })
  .refine(
    (d) => {
      if (d.from && d.to) return new Date(d.from) <= new Date(d.to);
      return true;
    },
    { message: "วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด" }
  );

export type DateRange = z.infer<typeof DateRangeSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardState {
  summary: FinancialSummary | null;
  revenueSeries: RevenueDataPoint[];
  channelBreakdown: ChannelBreakdown[];
  inventory: InventoryValueResult | null;
}

interface UseDashboardReturn extends DashboardState {
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  period: "daily" | "monthly";
  setPeriod: (p: "daily" | "monthly") => void;
  refetch: () => void;
  validationError: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard(): UseDashboardReturn {
  // Default date range: current month
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = now.toISOString().slice(0, 10);

  const [dateRange, setDateRangeRaw] = useState<DateRange>({
    from: defaultFrom,
    to: defaultTo,
  });
  const [period, setPeriod] = useState<"daily" | "monthly">("monthly");

  const [state, setState] = useState<DashboardState>({
    summary: null,
    revenueSeries: [],
    channelBreakdown: [],
    inventory: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Fetch all dashboard data in parallel ──────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      params.set("period", period);

      // Parallel fetch all 4 dashboard endpoints
      const [summaryRes, seriesRes, channelRes, inventoryRes] =
        await Promise.all([
          fetch(`/api/admin/dashboard/summary?${params}`),
          fetch(`/api/admin/dashboard/revenue-series?${params}`),
          fetch(`/api/admin/dashboard/channel-breakdown?${params}`),
          fetch(`/api/admin/dashboard/inventory`),
        ]);

      // Extract JSON, defaulting to empty on error
      const [summaryData, seriesData, channelData, inventoryData] =
        await Promise.all([
          summaryRes.ok ? summaryRes.json() : null,
          seriesRes.ok ? seriesRes.json() : [],
          channelRes.ok ? channelRes.json() : [],
          inventoryRes.ok ? inventoryRes.json() : null,
        ]);

      setState({
        summary: summaryData,
        revenueSeries: seriesData ?? [],
        channelBreakdown: channelData ?? [],
        inventory: inventoryData,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Date range setter with Zod validation ─────────────────────────────────
  const setDateRange = useCallback((range: DateRange) => {
    setValidationError(null);

    const parsed = DateRangeSchema.safeParse(range);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "ช่วงวันที่ไม่ถูกต้อง";
      setValidationError(msg);
      return;
    }

    setDateRangeRaw(parsed.data);
  }, []);

  return {
    ...state,
    isLoading,
    error,
    dateRange,
    setDateRange,
    period,
    setPeriod,
    refetch: fetchDashboard,
    validationError,
  };
}

// Re-export types from service so components don't need to import from 2 places
export type {
  FinancialSummary,
  RevenueDataPoint,
  ChannelBreakdown,
  InventoryValueResult,
};
