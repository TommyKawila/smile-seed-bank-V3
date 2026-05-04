import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeDiscountPercent } from "@/lib/product-utils";

export type BulkDiscountResult = {
  breederId: string;
  discountPercent: number;
  endsAt: string | null;
  articleBanners: ArticleBannerInput;
  campaignId: string | null;
  updatedVariants: number;
};

export type ArticleBannerInput = {
  thUrl?: string | null;
  enUrl?: string | null;
  mobileThUrl?: string | null;
  mobileEnUrl?: string | null;
};

export type CancelPromotionCampaignResult = {
  campaignId: string;
  breederId: string;
  updatedVariants: number;
  status: "cancelled";
};

export async function updateBulkDiscountByBreeder(
  breederId: string,
  discountPercent: number,
  endsAt: Date | null,
  articleBanners: ArticleBannerInput = {}
): Promise<BulkDiscountResult> {
  if (!/^\d+$/.test(breederId)) throw new Error("Invalid breeder id");
  const breederBigInt = BigInt(breederId);
  const safeDiscount = normalizeDiscountPercent(discountPercent);
  const status =
    safeDiscount <= 0
      ? "CLEARED"
      : endsAt && endsAt.getTime() < Date.now()
        ? "EXPIRED"
        : "ACTIVE";
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ updated_count: bigint }[]>`
      WITH updated AS (
        UPDATE product_variants pv
        SET discount_percent = ${safeDiscount},
            discount_ends_at = ${endsAt}
        FROM products p
        WHERE p.id = pv.product_id
          AND p.breeder_id = ${breederBigInt}
        RETURNING pv.id
      )
      SELECT COUNT(*)::bigint AS updated_count FROM updated
    `;
    const campaignRows = await tx.$queryRaw<{ id: bigint }[]>`
      INSERT INTO promotion_campaigns (
        name,
        image_url,
        promo_code,
        discount_type,
        discount_value,
        start_at,
        end_at,
        campaign_kind,
        breeder_id,
        discount_percent,
        ends_at,
        article_banner_th_url,
        article_banner_en_url,
        article_banner_mobile_th_url,
        article_banner_mobile_en_url,
        status,
        is_active
      )
      SELECT
        CONCAT('Bulk discount - ', b.name),
        '',
        CONCAT('BULK-', ${breederBigInt}::text, '-', EXTRACT(EPOCH FROM NOW())::bigint::text),
        'PERCENTAGE',
        ${safeDiscount},
        NOW(),
        COALESCE(${endsAt}, '9999-12-31 23:59:59+00'::timestamptz),
        'BULK_DISCOUNT',
        b.id,
        ${safeDiscount},
        ${endsAt},
        ${articleBanners.thUrl?.trim() || null},
        ${articleBanners.enUrl?.trim() || null},
        ${articleBanners.mobileThUrl?.trim() || null},
        ${articleBanners.mobileEnUrl?.trim() || null},
        ${status},
        ${status === "ACTIVE"}
      FROM breeders b
      WHERE b.id = ${breederBigInt}
      RETURNING id
    `;
    return {
      updatedVariants: Number(rows[0]?.updated_count ?? 0),
      campaignId: campaignRows[0]?.id != null ? String(campaignRows[0].id) : null,
    };
  });

  return {
    breederId,
    discountPercent: safeDiscount,
    endsAt: endsAt?.toISOString() ?? null,
    articleBanners: {
      thUrl: articleBanners.thUrl?.trim() || null,
      enUrl: articleBanners.enUrl?.trim() || null,
      mobileThUrl: articleBanners.mobileThUrl?.trim() || null,
      mobileEnUrl: articleBanners.mobileEnUrl?.trim() || null,
    },
    campaignId: result.campaignId,
    updatedVariants: result.updatedVariants,
  };
}

export async function cancelPromotionCampaign(
  campaignId: string
): Promise<CancelPromotionCampaignResult> {
  if (!/^\d+$/.test(campaignId)) throw new Error("Invalid campaign id");
  const campaignBigInt = BigInt(campaignId);

  const result = await prisma.$transaction(async (tx) => {
    const campaigns = await tx.$queryRaw<{ breeder_id: bigint | null }[]>`
      SELECT breeder_id
      FROM promotion_campaigns
      WHERE id = ${campaignBigInt}
        AND campaign_kind = 'BULK_DISCOUNT'
      FOR UPDATE
    `;
    const breederId = campaigns[0]?.breeder_id;
    if (breederId == null) throw new Error("Campaign not found or has no breeder");

    const rows = await tx.$queryRaw<{ updated_count: bigint }[]>`
      WITH updated AS (
        UPDATE product_variants pv
        SET discount_percent = 0,
            discount_ends_at = NULL
        FROM products p
        WHERE p.id = pv.product_id
          AND p.breeder_id = ${breederId}
        RETURNING pv.id
      )
      SELECT COUNT(*)::bigint AS updated_count FROM updated
    `;

    await tx.$executeRaw`
      UPDATE promotion_campaigns
      SET status = 'cancelled',
          is_active = false,
          updated_at = NOW()
      WHERE id = ${campaignBigInt}
    `;

    return {
      breederId: String(breederId),
      updatedVariants: Number(rows[0]?.updated_count ?? 0),
    };
  });

  return {
    campaignId,
    breederId: result.breederId,
    updatedVariants: result.updatedVariants,
    status: "cancelled",
  };
}
