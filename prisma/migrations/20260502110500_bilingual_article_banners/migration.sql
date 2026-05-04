ALTER TABLE "public"."promotion_campaigns"
  ADD COLUMN IF NOT EXISTS "article_banner_th_url" TEXT,
  ADD COLUMN IF NOT EXISTS "article_banner_en_url" TEXT,
  ADD COLUMN IF NOT EXISTS "article_banner_mobile_th_url" TEXT,
  ADD COLUMN IF NOT EXISTS "article_banner_mobile_en_url" TEXT;

UPDATE "public"."promotion_campaigns"
SET "article_banner_th_url" = COALESCE("article_banner_th_url", "article_banner_url")
WHERE "article_banner_url" IS NOT NULL
  AND "article_banner_url" <> ''
  AND ("article_banner_th_url" IS NULL OR "article_banner_th_url" = '');

DROP INDEX IF EXISTS "public"."promotion_campaigns_article_banner_idx";

CREATE INDEX IF NOT EXISTS "promotion_campaigns_article_banners_idx"
  ON "public"."promotion_campaigns" ("campaign_kind", "status", "created_at")
  WHERE COALESCE(
    "article_banner_th_url",
    "article_banner_en_url",
    "article_banner_mobile_th_url",
    "article_banner_mobile_en_url"
  ) IS NOT NULL;

ALTER TABLE "public"."promotion_campaigns"
  DROP COLUMN IF EXISTS "article_banner_url";
