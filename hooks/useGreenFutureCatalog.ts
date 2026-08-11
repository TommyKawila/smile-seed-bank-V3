"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PartnerDocumentRecord,
  PartnerSeedFormat,
  PartnerStockStatus,
  PartnerStrainRecord,
  PartnerSupplierRecord,
} from "@/types/partner-catalog";

type Filters = {
  q: string;
  format: PartnerSeedFormat | "ALL";
  stock: PartnerStockStatus | "ALL";
  ista: "CONFIRMED" | "ALL";
};

export function useGreenFutureCatalog(filters: Filters) {
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<PartnerSupplierRecord | null>(null);
  const [documents, setDocuments] = useState<PartnerDocumentRecord[]>([]);
  const [strains, setStrains] = useState<PartnerStrainRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.format !== "ALL") params.set("format", filters.format);
      if (filters.stock !== "ALL") params.set("stock", filters.stock);
      if (filters.ista === "CONFIRMED") params.set("ista", "CONFIRMED");
      params.set("limit", "300");
      const res = await fetch(`/api/admin/partners/green-future?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        supplier?: PartnerSupplierRecord;
        documents?: PartnerDocumentRecord[];
        strains?: PartnerStrainRecord[];
        total?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load catalog");
      setSupplier(json.supplier ?? null);
      setDocuments(json.documents ?? []);
      setStrains(json.strains ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filters.q, filters.format, filters.stock, filters.ista]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, supplier, documents, strains, total, error, refresh };
}
