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
    const res = await fetch("/api/storefront/breeders/active", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load breeders");
    const data = (await res.json()) as { breeders?: Breeder[] };
    const rows = Array.isArray(data.breeders) ? data.breeders : [];
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
