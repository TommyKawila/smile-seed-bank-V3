-- product_images: optional variant-specific gallery + shop listing flag

CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "variant_id" BIGINT,
    "url" TEXT NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "public"."product_images"("product_id");

ALTER TABLE "public"."product_images" DROP CONSTRAINT IF EXISTS "product_images_product_id_fkey";
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."product_images" DROP CONSTRAINT IF EXISTS "product_images_variant_id_fkey";
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select_public_active" ON "public"."product_images";
DROP POLICY IF EXISTS "product_images_select_by_product" ON "public"."product_images";
CREATE POLICY "product_images_select_by_product" ON "public"."product_images"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."products" p WHERE p.id = "product_images"."product_id")
  );
