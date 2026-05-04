ALTER TABLE "product_variants"
  ADD COLUMN IF NOT EXISTS "discount_percent" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_discount_percent_range"
  CHECK ("discount_percent" >= 0 AND "discount_percent" <= 99);
