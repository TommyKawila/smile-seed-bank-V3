import "server-only";

import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { HeroBanner } from "@/lib/hero-banners";
import { DEFAULT_HERO_BANNERS_FALLBACK } from "@/lib/hero-banners";
import type { HeroBannerAdmin, HeroBannerInput } from "@/lib/hero-banner-admin";

export type { HeroBannerAdmin, HeroBannerInput } from "@/lib/hero-banner-admin";

function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapRowToAdmin(row: {
  id: bigint;
  name: string;
  title_th: string;
  title_en: string | null;
  active: boolean;
  sort_order: number;
  link_url: string | null;
  desktop_th: string;
  desktop_en: string | null;
  mobile_th: string | null;
  mobile_en: string | null;
  panel_bg_hex: string | null;
  starts_at: Date | null;
  ends_at: Date | null;
}): HeroBannerAdmin {
  const titleTh = row.title_th.trim() ? row.title_th : row.name;
  return {
    id: String(row.id),
    titleTh,
    titleEn: row.title_en,
    active: row.active,
    sortOrder: row.sort_order,
    linkUrl: row.link_url,
    desktopTh: row.desktop_th,
    desktopEn: row.desktop_en,
    mobileTh: row.mobile_th,
    mobileEn: row.mobile_en,
    panelBgHex: row.panel_bg_hex?.trim() ? row.panel_bg_hex.trim().toUpperCase() : null,
    startsAt: row.starts_at ? row.starts_at.toISOString() : null,
    endsAt: row.ends_at ? row.ends_at.toISOString() : null,
  };
}

export function mapHeroRowToCarouselBanner(row: {
  id: bigint;
  name: string;
  title_th: string;
  title_en: string | null;
  desktop_th: string;
  desktop_en: string | null;
  mobile_th: string | null;
  mobile_en: string | null;
  panel_bg_hex: string | null;
  link_url: string | null;
}): HeroBanner {
  const mobileBase =
    row.mobile_th != null && row.mobile_th.trim() !== ""
      ? row.mobile_th
      : row.desktop_th;
  const mobileEnResolved =
    row.mobile_en != null && row.mobile_en.trim() !== ""
      ? row.mobile_en
      : row.desktop_en != null && row.desktop_en.trim() !== ""
        ? row.desktop_en
        : null;
  const altTh = row.title_th.trim() ? row.title_th : row.name;
  const altEn = row.title_en?.trim() ? row.title_en.trim() : null;
  return {
    id: String(row.id),
    desktopSrc: row.desktop_th,
    mobileSrc: mobileBase,
    desktopSrcEn: row.desktop_en?.trim() ? row.desktop_en : null,
    mobileSrcEn: mobileEnResolved?.trim() ? mobileEnResolved : null,
    altTh,
    altEn,
    link: row.link_url ?? "",
    panelBgHex: row.panel_bg_hex?.trim() ? row.panel_bg_hex.trim().toUpperCase() : null,
  };
}

/** Active slides at server `now`. Falls back to `DEFAULT_HERO_BANNERS_FALLBACK` when none qualify. */
export async function getActiveHeroBannersForCarousel(): Promise<HeroBanner[]> {
  const now = new Date();
  const rows = await prisma.hero_banners.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ starts_at: null }, { starts_at: { lte: now } }] },
        { OR: [{ ends_at: null }, { ends_at: { gte: now } }] },
      ],
    },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      title_th: true,
      title_en: true,
      desktop_th: true,
      desktop_en: true,
      mobile_th: true,
      mobile_en: true,
      panel_bg_hex: true,
      link_url: true,
    },
  });
  if (rows.length === 0) return DEFAULT_HERO_BANNERS_FALLBACK;
  return rows.map(mapHeroRowToCarouselBanner);
}

export const getHeroCarouselBannersCached = unstable_cache(
  async () => getActiveHeroBannersForCarousel(),
  ["home-hero-carousel"],
  { tags: ["home-hero-banners"] }
);

export async function getAdminHeroBanners(): Promise<HeroBannerAdmin[]> {
  const rows = await prisma.hero_banners.findMany({
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  return rows.map(mapRowToAdmin);
}

export async function createHeroBanner(input: HeroBannerInput): Promise<HeroBannerAdmin> {
  if (!input.titleTh.trim()) throw new Error("titleTh is required");
  if (!input.desktopTh.trim()) throw new Error("desktopTh is required");
  const maxRow = await prisma.hero_banners.aggregate({ _max: { sort_order: true } });
  const nextOrder = Number(maxRow._max.sort_order ?? -1) + 1;
  const row = await prisma.hero_banners.create({
    data: {
      name: input.titleTh.trim(),
      title_th: input.titleTh.trim(),
      title_en: input.titleEn,
      active: input.active,
      sort_order: nextOrder,
      link_url: input.linkUrl,
      desktop_th: input.desktopTh.trim(),
      desktop_en: input.desktopEn,
      mobile_th: input.mobileTh,
      mobile_en: input.mobileEn,
      panel_bg_hex: input.panelBgHex,
      starts_at: toDate(input.startsAt),
      ends_at: toDate(input.endsAt),
    },
  });
  return mapRowToAdmin(row);
}

export async function updateHeroBanner(
  id: bigint,
  input: HeroBannerInput
): Promise<HeroBannerAdmin> {
  if (!input.titleTh.trim()) throw new Error("titleTh is required");
  if (!input.desktopTh.trim()) throw new Error("desktopTh is required");
  try {
    const row = await prisma.hero_banners.update({
      where: { id },
      data: {
        name: input.titleTh.trim(),
        title_th: input.titleTh.trim(),
        title_en: input.titleEn,
        active: input.active,
        link_url: input.linkUrl,
        desktop_th: input.desktopTh.trim(),
        desktop_en: input.desktopEn,
        mobile_th: input.mobileTh,
        mobile_en: input.mobileEn,
        panel_bg_hex: input.panelBgHex,
        starts_at: toDate(input.startsAt),
        ends_at: toDate(input.endsAt),
      },
    });
    return mapRowToAdmin(row);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new Error("Hero banner not found");
    }
    throw e;
  }
}

export async function deleteHeroBanner(id: bigint): Promise<void> {
  try {
    await prisma.hero_banners.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new Error("Hero banner not found");
    }
    throw e;
  }
}

export async function updateHeroBannerOrder(ids: bigint[]): Promise<void> {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.$executeRaw(
        Prisma.sql`UPDATE hero_banners SET sort_order = ${index}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`
      )
    )
  );
}
