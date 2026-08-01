"use client";

import { useCallback, useEffect, useState } from "react";
import type { B2BQuoteDraft, B2BQuoteRecord } from "@/types/b2b-quote";

export function useB2BQuoteDrafts() {
  const [quotes, setQuotes] = useState<B2BQuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/b2b-quotes");
      const data = (await res.json().catch(() => ({}))) as {
        quotes?: B2BQuoteRecord[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load quotes");
      setQuotes(data.quotes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDraft = useCallback(
    async (input: B2BQuoteDraft & { id?: string | null; quoteNumber?: string | null }) => {
      setSaving(true);
      try {
        const res = await fetch("/api/admin/b2b-quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, status: "DRAFT" }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          quote?: B2BQuoteRecord;
          error?: string;
        };
        if (!res.ok || !data.quote) throw new Error(data.error ?? "Failed to save");
        await refresh();
        return { success: true as const, quote: data.quote };
      } catch (err) {
        return {
          success: false as const,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/b2b-quotes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to delete");
      }
      await refresh();
    },
    [refresh]
  );

  return { quotes, loading, saving, refresh, saveDraft, remove };
}
