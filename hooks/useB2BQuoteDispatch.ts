"use client";

import { useCallback, useState } from "react";
import type { B2BQuoteDispatchInput } from "@/types/b2b-quote";

export function useB2BQuoteDispatch() {
  const [sending, setSending] = useState(false);

  const sendEmail = useCallback(async (input: B2BQuoteDispatchInput) => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/b2b-quotes/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        quoteId?: string | null;
        quoteNumber?: string | null;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      return {
        success: true as const,
        quoteId: data.quoteId ?? null,
        quoteNumber: data.quoteNumber ?? null,
      };
    } catch (err) {
      return {
        success: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      setSending(false);
    }
  }, []);

  return { sendEmail, sending };
}
