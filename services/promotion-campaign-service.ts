import "server-only";

import { prisma } from "@/lib/prisma";
import { seedsBreederHref } from "@/lib/breeder-slug";

export type ArticleCampaignBannerData = {
  id: string;
  name: string;
  articleBannerThUrl: string | null;
  articleBannerEnUrl: string | null;
  articleBannerMobileThUrl: string | null;
  articleBannerMobileEnUrl: string | null;
  href: string;
  breederName: string | null;
};

export type ArticleCampaignBannerAdminRow = ArticleCampaignBannerData & {
  discountPercent: number | null;
  status: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export type ArticleCampaignBannerInput = {
  articleBannerThUrl?: string | null;
  articleBannerEnUrl?: string | null;
  articleBannerMobileThUrl?: string | null;
  articleBannerMobileEnUrl?: string | null;
};

export async function getLatestArticleCampaignBanner(): Promise<ArticleCampaignBannerData | null> {
  const rows = await prisma.$queryRaw<
    {
      id: bigint;
      name: string;
      article_banner_th_url: string | null;
      article_banner_en_url: string | null;
      article_banner_mobile_th_url: string | null;
      article_banner_mobile_en_url: string | null;
      breeder_name: string | null;
    }[]
  >`
    SELECT
      pc.id,
      pc.name,
      pc.article_banner_th_url,
      pc.article_banner_en_url,
      pc.article_banner_mobile_th_url,
      pc.article_banner_mobile_en_url,
      b.name AS breeder_name
    FROM promotion_campaigns pc
    LEFT JOIN breeders b ON b.id = pc.breeder_id
    WHERE pc.is_active = true
      AND pc.status = 'ACTIVE'
      AND pc.start_at <= NOW()
      AND pc.end_at >= NOW()
      AND COALESCE(
        pc.article_banner_th_url,
        pc.article_banner_en_url,
        pc.article_banner_mobile_th_url,
        pc.article_banner_mobile_en_url
      ) IS NOT NULL
    ORDER BY pc.created_at DESC, pc.id DESC
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    articleBannerThUrl: row.article_banner_th_url?.trim() || null,
    articleBannerEnUrl: row.article_banner_en_url?.trim() || null,
    articleBannerMobileThUrl: row.article_banner_mobile_th_url?.trim() || null,
    articleBannerMobileEnUrl: row.article_banner_mobile_en_url?.trim() || null,
    href: row.breeder_name ? seedsBreederHref({ name: row.breeder_name }) : "/shop",
    breederName: row.breeder_name,
  };
}

export async function getAdminArticleCampaignBanners(): Promise<ArticleCampaignBannerAdminRow[]> {
  const rows = await prisma.$queryRaw<
    {
      id: bigint;
      name: string;
      article_banner_th_url: string | null;
      article_banner_en_url: string | null;
      article_banner_mobile_th_url: string | null;
      article_banner_mobile_en_url: string | null;
      breeder_name: string | null;
      discount_percent: number | null;
      status: string;
      ends_at: Date | null;
      is_active: boolean;
      created_at: Date;
    }[]
  >`
    SELECT
      pc.id,
      pc.name,
      pc.article_banner_th_url,
      pc.article_banner_en_url,
      pc.article_banner_mobile_th_url,
      pc.article_banner_mobile_en_url,
      b.name AS breeder_name,
      pc.discount_percent,
      CASE
        WHEN pc.status = 'ACTIVE' AND pc.ends_at IS NOT NULL AND pc.ends_at < NOW() THEN 'EXPIRED'
        ELSE pc.status
      END AS status,
      pc.ends_at,
      pc.is_active,
      pc.created_at
    FROM promotion_campaigns pc
    LEFT JOIN breeders b ON b.id = pc.breeder_id
    WHERE pc.is_active = true
      AND pc.status = 'ACTIVE'
      AND pc.start_at <= NOW()
      AND pc.end_at >= NOW()
      AND COALESCE(
        pc.article_banner_th_url,
        pc.article_banner_en_url,
        pc.article_banner_mobile_th_url,
        pc.article_banner_mobile_en_url
      ) IS NOT NULL
    ORDER BY pc.created_at DESC, pc.id DESC
  `;

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    articleBannerThUrl: row.article_banner_th_url?.trim() || null,
    articleBannerEnUrl: row.article_banner_en_url?.trim() || null,
    articleBannerMobileThUrl: row.article_banner_mobile_th_url?.trim() || null,
    articleBannerMobileEnUrl: row.article_banner_mobile_en_url?.trim() || null,
    href: row.breeder_name ? seedsBreederHref({ name: row.breeder_name }) : "/shop",
    breederName: row.breeder_name,
    discountPercent: row.discount_percent,
    status: row.status,
    endsAt: row.ends_at?.toISOString() ?? null,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function updateArticleCampaignBanners(
  campaignId: bigint,
  input: ArticleCampaignBannerInput
): Promise<ArticleCampaignBannerAdminRow> {
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    UPDATE promotion_campaigns
    SET article_banner_th_url = ${input.articleBannerThUrl?.trim() || null},
        article_banner_en_url = ${input.articleBannerEnUrl?.trim() || null},
        article_banner_mobile_th_url = ${input.articleBannerMobileThUrl?.trim() || null},
        article_banner_mobile_en_url = ${input.articleBannerMobileEnUrl?.trim() || null},
        updated_at = NOW()
    WHERE id = ${campaignId}
    RETURNING id
  `;
  if (!rows[0]) throw new Error("Campaign not found");

  const updated = await getAdminArticleCampaignBanners();
  const row = updated.find((campaign) => campaign.id === String(campaignId));
  if (!row) throw new Error("Campaign no longer active or has no article banner");
  return row;
}
