"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Breeder } from "@/types/supabase";

export function useBreeders() {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("breeders")
      .select(`
        id, name, logo_url, is_active,
        description, description_en,
        summary_th, summary_en,
        highlight_origin_th, highlight_origin_en,
        highlight_specialty_th, highlight_specialty_en,
        highlight_reputation_th, highlight_reputation_en,
        highlight_focus_th, highlight_focus_en
      `)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setBreeders((data as Breeder[]) ?? []);
        setIsLoading(false);
      });
  }, []);

  return { breeders, isLoading };
}
