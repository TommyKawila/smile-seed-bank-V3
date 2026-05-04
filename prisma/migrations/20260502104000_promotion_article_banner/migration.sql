ALTER TABLE "public"."promotion_campaigns"
  ADD COLUMN IF NOT EXISTS "article_banner_url" TEXT;

CREATE INDEX IF NOT EXISTS "promotion_campaigns_article_banner_idx"
  ON "public"."promotion_campaigns" ("campaign_kind", "status", "created_at")
  WHERE "article_banner_url" IS NOT NULL AND "article_banner_url" <> '';
