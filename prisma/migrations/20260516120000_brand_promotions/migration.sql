-- Brand-level checkout discounts (matched to breeders.name, case-insensitive).
CREATE TABLE IF NOT EXISTS "public"."brand_promotions" (
    "id" BIGSERIAL NOT NULL,
    "brand_name" TEXT NOT NULL,
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_promotions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "brand_promotions_brand_name_normalized_key"
  ON "public"."brand_promotions" (LOWER(TRIM("brand_name")));
