-- Clearance landing: per-breeder banner boxes (fixed 50% promo)
CREATE TABLE IF NOT EXISTS "clearance_breeder_banners" (
  "id" BIGSERIAL PRIMARY KEY,
  "breeder_id" BIGINT NOT NULL,
  "image_url" TEXT,
  "title_th" TEXT NOT NULL DEFAULT '',
  "title_en" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "clearance_breeder_banners_breeder_id_fkey"
    FOREIGN KEY ("breeder_id") REFERENCES "breeders"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "clearance_breeder_banners_breeder_id_key"
  ON "clearance_breeder_banners"("breeder_id");

CREATE INDEX IF NOT EXISTS "clearance_breeder_banners_active_sort_idx"
  ON "clearance_breeder_banners"("is_active", "sort_order", "id");
