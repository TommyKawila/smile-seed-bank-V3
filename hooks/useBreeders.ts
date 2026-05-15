"use client";

import { useState, useEffect } from "react";
import { useBreederCatalogOptional } from "@/context/BreederCatalogContext";
import { fetchActiveBreeders } from "@/services/breeder-service";
import type { Breeder } from "@/types/supabase";

export function useBreeders() {
  const catalog = useBreederCatalogOptional();
  const standalone = catalog === null;
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!standalone) return;
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
  }, [standalone]);

  if (catalog !== null) {
    return { breeders: catalog.breeders, isLoading: catalog.isLoading };
  }
  return { breeders, isLoading };
}
