ALTER TABLE "product_variants"
  ADD COLUMN IF NOT EXISTS "discount_ends_at" TIMESTAMPTZ(6);

ALTER TABLE "product_variants"
  DROP CONSTRAINT IF EXISTS "product_variants_discount_percent_range";

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_discount_percent_range"
  CHECK ("discount_percent" >= 0 AND "discount_percent" <= 100);
