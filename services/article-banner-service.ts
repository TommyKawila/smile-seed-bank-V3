import "server-only";

import { prisma } from "@/lib/prisma";
import type { ArticleBannerAdminRow } from "@/lib/article-banner-admin";

export type { ArticleBannerAdminRow } from "@/lib/article-banner-admin";

export type ArticleBannerBlogPayload = {
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  titleAlt: string;
  destinationUrl: string;
};

export type ArticleBannerCreateInput = {
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  titleAlt: string;
  destinationUrl: string;
  active?: boolean;
};

export type ArticleBannerUpdateInput = Partial<{
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  titleAlt: string;
  destinationUrl: string;
  active: boolean;
  sortOrder: number;
}>;

function mapAdmin(row: {
  id: bigint;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  title_alt: string;
  destination_url: string;
  active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}): ArticleBannerAdminRow {
  return {
    id: String(row.id),
    desktopImageUrl: row.desktop_image_url?.trim() || null,
    mobileImageUrl: row.mobile_image_url?.trim() || null,
    titleAlt: row.title_alt.trim(),
    destinationUrl: row.destination_url.trim() || "/",
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** First active banner with at least one image URL (by sort_order). */
export async function getArticleBannerForBlog(): Promise<ArticleBannerBlogPayload | null> {
  const rows = await prisma.article_banners.findMany({
    where: { active: true },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    const desktop = row.desktop_image_url?.trim() || null;
    const mobile = row.mobile_image_url?.trim() || null;
    if (!desktop && !mobile) continue;
    return {
      desktopImageUrl: desktop,
      mobileImageUrl: mobile,
      titleAlt: row.title_alt.trim() || "Smile Seed Bank",
      destinationUrl: row.destination_url.trim() || "/shop",
    };
  }
  return null;
}

export async function getAdminArticleBanners(): Promise<ArticleBannerAdminRow[]> {
  const rows = await prisma.article_banners.findMany({
    orderBy: [{ sort_order: "asc" }, { id: "desc" }],
  });
  return Array.isArray(rows) ? rows.map(mapAdmin) : [];
}

async function nextSortOrder(): Promise<number> {
  const agg = await prisma.article_banners.aggregate({ _max: { sort_order: true } });
  return (agg._max.sort_order ?? -1) + 1;
}

export async function createArticleBanner(input: ArticleBannerCreateInput): Promise<ArticleBannerAdminRow> {
  const row = await prisma.article_banners.create({
    data: {
      desktop_image_url: input.desktopImageUrl?.trim() || null,
      mobile_image_url: input.mobileImageUrl?.trim() || null,
      title_alt: input.titleAlt.trim(),
      destination_url: input.destinationUrl.trim() || "/",
      active: input.active ?? true,
      sort_order: await nextSortOrder(),
    },
  });
  return mapAdmin(row);
}

export async function updateArticleBanner(
  id: bigint,
  input: ArticleBannerUpdateInput
): Promise<ArticleBannerAdminRow> {
  const existing = await prisma.article_banners.findUnique({ where: { id } });
  if (!existing) throw new Error("Article banner not found");

  const row = await prisma.article_banners.update({
    where: { id },
    data: {
      ...(input.desktopImageUrl !== undefined && {
        desktop_image_url: input.desktopImageUrl?.trim() || null,
      }),
      ...(input.mobileImageUrl !== undefined && {
        mobile_image_url: input.mobileImageUrl?.trim() || null,
      }),
      ...(input.titleAlt !== undefined && { title_alt: input.titleAlt.trim() }),
      ...(input.destinationUrl !== undefined && {
        destination_url: input.destinationUrl.trim() || "/",
      }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.sortOrder !== undefined && { sort_order: input.sortOrder }),
    },
  });
  return mapAdmin(row);
}

export async function deleteArticleBanner(id: bigint): Promise<void> {
  try {
    await prisma.article_banners.delete({ where: { id } });
  } catch {
    throw new Error("Article banner not found");
  }
}
