-- Clearance multi-% groups: store discount tier on product; backfill existing to 50.
ALTER TABLE "public"."products"
  ADD COLUMN IF NOT EXISTS "clearance_discount_percent" INTEGER;

UPDATE "public"."products"
SET "clearance_discount_percent" = 50
WHERE "is_clearance" IS TRUE
  AND ("clearance_discount_percent" IS NULL OR "clearance_discount_percent" NOT IN (50, 30, 25));

CREATE INDEX IF NOT EXISTS "idx_products_clearance_discount_percent"
  ON "public"."products" ("is_clearance", "clearance_discount_percent")
  WHERE "is_clearance" IS TRUE;
