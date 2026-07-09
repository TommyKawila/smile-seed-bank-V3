"use client";

import { useCallback, useState } from "react";
import type { BusinessDocumentDispatchInput } from "@/types/business-document";

export function useBusinessDocumentDispatch() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (input: BusinessDocumentDispatchInput) => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/business-documents/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      return { success: true as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return { success: false as const, error: msg };
    } finally {
      setSending(false);
    }
  }, []);

  return { sendEmail, sending, error, clearError: () => setError(null) };
}
