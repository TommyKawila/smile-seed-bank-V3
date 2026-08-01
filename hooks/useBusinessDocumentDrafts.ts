"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  BusinessDocumentDraft,
  BusinessDocumentRecord,
} from "@/types/business-document";

export function useBusinessDocumentDrafts() {
  const [documents, setDocuments] = useState<BusinessDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/business-documents");
      const data = (await res.json().catch(() => ({}))) as {
        documents?: BusinessDocumentRecord[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load documents");
      setDocuments(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDraft = useCallback(
    async (
      input: BusinessDocumentDraft & {
        recipientEmail?: string;
        id?: string | null;
      }
    ) => {
      setSaving(true);
      try {
        const res = await fetch("/api/admin/business-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, status: "DRAFT" }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          document?: BusinessDocumentRecord;
          error?: string;
        };
        if (!res.ok || !data.document) {
          throw new Error(data.error ?? "Failed to save draft");
        }
        await refresh();
        return { success: true as const, document: data.document };
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
      const res = await fetch(`/api/admin/business-documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to delete");
      }
      await refresh();
    },
    [refresh]
  );

  return { documents, loading, saving, refresh, saveDraft, remove };
}
