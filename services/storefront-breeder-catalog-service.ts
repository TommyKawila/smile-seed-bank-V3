import "server-only";

import { prisma } from "@/lib/prisma";
import type { Breeder } from "@/types/supabase";

function toNum(v: bigint): number {
  return Number(v);
}

/** Active breeders for navbar ribbon / catalog — same fields as legacy Supabase select. */
export async function listActiveBreedersForStorefront(): Promise<Breeder[]> {
  const rows = await prisma.breeders.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
    select: {
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
    },
  });

  return rows.map((b) => ({
    id: toNum(b.id),
    name: b.name,
    logo_url: b.logo_url,
    description: b.description,
    description_en: b.description_en,
    summary_th: b.summary_th,
    summary_en: b.summary_en,
    highlight_origin_th: b.highlight_origin_th,
    highlight_origin_en: b.highlight_origin_en,
    highlight_specialty_th: b.highlight_specialty_th,
    highlight_specialty_en: b.highlight_specialty_en,
    highlight_reputation_th: b.highlight_reputation_th,
    highlight_reputation_en: b.highlight_reputation_en,
    highlight_focus_th: b.highlight_focus_th,
    highlight_focus_en: b.highlight_focus_en,
    is_active: b.is_active ?? true,
  }));
}
