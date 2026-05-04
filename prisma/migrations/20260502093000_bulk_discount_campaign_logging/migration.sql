ALTER TABLE "public"."promotion_campaigns"
  ADD COLUMN IF NOT EXISTS "campaign_kind" TEXT NOT NULL DEFAULT 'POPUP',
  ADD COLUMN IF NOT EXISTS "breeder_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "discount_percent" INTEGER,
  ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promotion_campaigns_discount_percent_range'
  ) THEN
    ALTER TABLE "public"."promotion_campaigns"
      ADD CONSTRAINT "promotion_campaigns_discount_percent_range"
      CHECK ("discount_percent" IS NULL OR ("discount_percent" >= 0 AND "discount_percent" <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promotion_campaigns_breeder_id_fkey'
  ) THEN
    ALTER TABLE "public"."promotion_campaigns"
      ADD CONSTRAINT "promotion_campaigns_breeder_id_fkey"
      FOREIGN KEY ("breeder_id") REFERENCES "public"."breeders"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "promotion_campaigns_bulk_discount_idx"
  ON "public"."promotion_campaigns" ("campaign_kind", "status", "ends_at");

CREATE INDEX IF NOT EXISTS "promotion_campaigns_breeder_id_idx"
  ON "public"."promotion_campaigns" ("breeder_id");
