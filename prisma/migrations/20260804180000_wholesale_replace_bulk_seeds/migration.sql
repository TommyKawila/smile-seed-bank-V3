-- Drop unused Bulk Seeds table
DROP TABLE IF EXISTS "public"."bulk_seeds";

-- Wholesale settings (single row)
CREATE TABLE IF NOT EXISTS "public"."wholesale_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "moq" INTEGER NOT NULL DEFAULT 100,
  "gacp_fee_thb" DECIMAL(12,2) NOT NULL DEFAULT 3500,
  "gacp_fee_eur" DECIMAL(12,2) NOT NULL DEFAULT 100,
  "tiers" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "wholesale_settings_pkey" PRIMARY KEY ("id")
);

-- Wholesale catalog strains
CREATE TABLE IF NOT EXISTS "public"."wholesale_catalog_strains" (
  "id" BIGSERIAL NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "type_label" VARCHAR(64) NOT NULL DEFAULT 'Feminized',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "wholesale_catalog_strains_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_wholesale_catalog_active_sort"
  ON "public"."wholesale_catalog_strains" ("is_active", "sort_order");

-- Seed defaults matching previous hardcoded /wholesale values
INSERT INTO "public"."wholesale_settings" ("id", "moq", "gacp_fee_thb", "gacp_fee_eur", "tiers")
VALUES (
  1,
  100,
  3500,
  100,
  '[
    {"minQty":100,"maxQty":999,"thbPerSeed":65,"eurPerSeed":1.75,"bestValue":false},
    {"minQty":1000,"maxQty":2499,"thbPerSeed":55,"eurPerSeed":1.5,"bestValue":false},
    {"minQty":2500,"maxQty":null,"thbPerSeed":50,"eurPerSeed":1.35,"bestValue":true}
  ]'::jsonb
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."wholesale_catalog_strains" ("name", "type_label", "sort_order", "is_active")
SELECT v.name, 'Feminized', v.sort_order, true
FROM (VALUES
  ('White Widow', 0),
  ('Northern Lights', 1),
  ('Pineapple Express Auto', 2),
  ('Do-Si-Dos Auto', 3),
  ('Bubba Kush', 4)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "public"."wholesale_catalog_strains" LIMIT 1);
