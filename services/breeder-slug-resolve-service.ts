import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";
import type { Breeder } from "@/types/supabase";

const BREEDER_SELECT = {
  id: true,
  name: true,
  logo_url: true,
  description: true,
  description_en: true,
  summary_th: true,
  summary_en: true,
  highlight_origin_th: true,
  highlight_origin_en: true,
  highlight_specialty_th: true,
  highlight_specialty_en: true,
  highlight_reputation_th: true,
  highlight_reputation_en: true,
  highlight_focus_th: true,
  highlight_focus_en: true,
  is_active: true,
} as const;

type CachedBreeder = Breeder & { slug: string };

const getActiveBreederSlugIndex = unstable_cache(
  async (): Promise<CachedBreeder[]> => {
    const rows = await prisma.breeders.findMany({
      where: { is_active: true },
      select: BREEDER_SELECT,
    });
    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      logo_url: row.logo_url,
      description: row.description,
      description_en: row.description_en,
      summary_th: row.summary_th,
      summary_en: row.summary_en,
      highlight_origin_th: row.highlight_origin_th,
      highlight_origin_en: row.highlight_origin_en,
      highlight_specialty_th: row.highlight_specialty_th,
      highlight_specialty_en: row.highlight_specialty_en,
      highlight_reputation_th: row.highlight_reputation_th,
      highlight_reputation_en: row.highlight_reputation_en,
      highlight_focus_th: row.highlight_focus_th,
      highlight_focus_en: row.highlight_focus_en,
      is_active: Boolean(row.is_active),
      slug: breederSlugFromName(row.name).toLowerCase(),
    }));
  },
  ["storefront-active-breeder-slug-index"],
  { revalidate: 300 }
);

export async function resolveBreederBySlugFromCache(
  slug: string | undefined
): Promise<Breeder | null> {
  const normalized = decodeURIComponent(slug ?? "").trim().toLowerCase();
  if (!normalized) return null;
  const index = await getActiveBreederSlugIndex();
  const match = index.find((b) => b.slug === normalized);
  if (!match) return null;
  const { slug: _slug, ...breeder } = match;
  return breeder;
}

/** Slug (preferred) or legacy numeric `?breeder=` id — single SSR lookup. */
export async function resolveBreederFromShopParamCached(
  param: string | undefined
): Promise<Breeder | null> {
  const raw = decodeURIComponent(param ?? "").trim();
  if (!raw) return null;
  const index = await getActiveBreederSlugIndex();
  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    if (!Number.isSafeInteger(id)) return null;
    const match = index.find((b) => b.id === id);
    if (!match) return null;
    const { slug: _slug, ...breeder } = match;
    return breeder;
  }
  return resolveBreederBySlugFromCache(raw);
}

export async function resolveBreederIdFromSlugCached(
  slug: string | undefined
): Promise<number | undefined> {
  const breeder = await resolveBreederFromShopParamCached(slug);
  return breeder?.id;
}
