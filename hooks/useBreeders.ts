"use client";

import { useState, useEffect } from "react";
import { fetchActiveBreeders } from "@/services/breeder-service";
import type { Breeder } from "@/types/supabase";

export function useBreeders() {
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

  return { breeders, isLoading };
}
