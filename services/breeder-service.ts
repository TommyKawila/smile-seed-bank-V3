import { createClient } from "@/lib/supabase/client";
import type { Breeder } from "@/types/supabase";

/** Dedupe concurrent + repeat mounts (`Navbar` desktop/mobile ribbons share `useBreeders`). */
const ACTIVE_BREEDERS_STALE_MS = 15 * 60 * 1000;
let activeBreedersCache: Breeder[] | null = null;
let activeBreedersFetchedAt = 0;
let activeBreedersInflight: Promise<Breeder[]> | null = null;

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
  const now = Date.now();
  if (activeBreedersCache && now - activeBreedersFetchedAt < ACTIVE_BREEDERS_STALE_MS) {
    return activeBreedersCache;
  }
  if (activeBreedersInflight) return activeBreedersInflight;

  activeBreedersInflight = (async () => {
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
    const rows = (data ?? []) as Breeder[];
    activeBreedersCache = rows;
    activeBreedersFetchedAt = Date.now();
    return rows;
  })().finally(() => {
    activeBreedersInflight = null;
  });

  return activeBreedersInflight;
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
