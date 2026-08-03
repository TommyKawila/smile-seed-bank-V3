"use client";

import { useCallback, useEffect, useState } from "react";
import type { BusinessContactRecord } from "@/types/business-contact";

export function useBusinessContacts() {
  const [contacts, setContacts] = useState<BusinessContactRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/business-contacts");
      const data = (await res.json().catch(() => ({}))) as {
        contacts?: BusinessContactRecord[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load contacts");
      setContacts(data.contacts ?? []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { contacts, loading, refresh };
}
