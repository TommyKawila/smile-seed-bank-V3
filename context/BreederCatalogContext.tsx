"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchActiveBreeders } from "@/services/breeder-service";
import type { Breeder } from "@/types/supabase";

export type BreederCatalogContextValue = {
  breeders: Breeder[];
  isLoading: boolean;
};

const BreederCatalogContext = createContext<BreederCatalogContextValue | null>(null);

export function BreederCatalogProvider({ children }: { children: React.ReactNode }) {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchActiveBreeders()
      .then((data) => {
        if (!cancelled) setBreeders(data);
      })
      .catch(() => {
        if (!cancelled) setBreeders([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ breeders, isLoading }), [breeders, isLoading]);

  return (
    <BreederCatalogContext.Provider value={value}>{children}</BreederCatalogContext.Provider>
  );
}

export function useBreederCatalogOptional(): BreederCatalogContextValue | null {
  return useContext(BreederCatalogContext);
}
