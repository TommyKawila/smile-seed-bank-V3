-- Homepage conversion order: commerce rails before content; disable broken breeders ribbon block.
INSERT INTO "homepage_sections" ("id", "key", "label_th", "label_en", "sort_order", "is_active")
VALUES (
  'hpsec_ai_quick_tools',
  'ai_quick_tools_dock',
  'เครื่องมือ AI ด่วน',
  'AI Quick Tools Dock',
  1,
  true
) ON CONFLICT ("key") DO NOTHING;

UPDATE "homepage_sections" SET "sort_order" = 1, "is_active" = true WHERE "key" = 'ai_quick_tools_dock';
UPDATE "homepage_sections" SET "sort_order" = 2, "is_active" = true WHERE "key" = 'categories';
UPDATE "homepage_sections" SET "sort_order" = 3, "is_active" = true WHERE "key" = 'breeder_showcase';
UPDATE "homepage_sections" SET "sort_order" = 4, "is_active" = true WHERE "key" = 'promotion_banner';
UPDATE "homepage_sections" SET "sort_order" = 5, "is_active" = true WHERE "key" = 'new_strains';
UPDATE "homepage_sections" SET "sort_order" = 6, "is_active" = true WHERE "key" = 'clearance';
UPDATE "homepage_sections" SET "sort_order" = 7, "is_active" = true WHERE "key" = 'featured';
UPDATE "homepage_sections" SET "sort_order" = 8, "is_active" = true WHERE "key" = 'blog';
UPDATE "homepage_sections" SET "sort_order" = 9, "is_active" = true WHERE "key" = 'trust';
UPDATE "homepage_sections" SET "sort_order" = 10, "is_active" = true WHERE "key" = 'newsletter';
UPDATE "homepage_sections" SET "is_active" = false WHERE "key" = 'breeders';

UPDATE "homepage_sections"
SET
  "label_th" = 'แบนเนอร์มาใหม่ / ลดราคา',
  "label_en" = 'New & clearance intent banners'
WHERE "key" = 'promotion_banner';
