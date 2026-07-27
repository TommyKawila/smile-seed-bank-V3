"use client";

import { useCallback, useEffect, useState } from "react";

export type GrowerToolsUsagePayload = {
  range: { start: string; end: string; preset: string };
  totals: {
    calls: number;
    okCalls: number;
    errors: number;
    rateLimited: number;
    budgetBlocked: number;
    tokens: number;
    estimatedUsd: number;
  };
  byAction: { action: string; calls: number; tokens: number; usd: number }[];
  byDay: { date: string; calls: number; usd: number }[];
  recent: {
    id: string;
    action: string;
    model: string;
    status: string;
    tokens: number;
    usd: number;
    latencyMs: number;
    createdAt: string;
  }[];
  budget: {
    dailyUsd: number;
    monthlyUsd: number;
    autoDisable: boolean;
    trippedAt: string | null;
    dailySpend: number;
    monthlySpend: number;
  };
};

export function useGrowerToolsUsage(preset: "7" | "30" | "month") {
  const [data, setData] = useState<GrowerToolsUsagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/grower-tools/usage?range=${preset}`);
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to load usage");
      }
      setData(body as GrowerToolsUsagePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
