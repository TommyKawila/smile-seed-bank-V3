-- Clearance pricing + homepage section key
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sale_price" DECIMAL(65,30);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_clearance" BOOLEAN DEFAULT false;

INSERT INTO "homepage_sections" ("id", "key", "label_th", "label_en", "sort_order", "is_active")
VALUES (
  'hpsec_clearance',
  'clearance',
  'คลังล้างสต็อก',
  'Clearance Vault',
  14,
  true
) ON CONFLICT ("key") DO NOTHING;
