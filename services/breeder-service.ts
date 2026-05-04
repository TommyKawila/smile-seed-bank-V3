import { createClient } from "@/lib/supabase/client";
import type { Breeder } from "@/types/supabase";

export type BreederShowcaseRow = {
  id: number;
  name: string;
  logoUrl: string | null;
  strainCount: number;
  slug: string;
};

export type BreederShowcasePayload = {
  breeders: BreederShowcaseRow[];
  totalBreeders: number | null;
};

export async function fetchActiveBreeders(): Promise<Breeder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
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
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Breeder[];
}

export async function fetchBreederShowcase(): Promise<BreederShowcasePayload> {
  const res = await fetch("/api/storefront/breeder-showcase", { cache: "no-store" });
  if (!res.ok) return { breeders: [], totalBreeders: null };
  const data = (await res.json()) as Partial<BreederShowcasePayload>;
  return {
    breeders: Array.isArray(data.breeders) ? data.breeders : [],
    totalBreeders: typeof data.totalBreeders === "number" ? data.totalBreeders : null,
  };
}
