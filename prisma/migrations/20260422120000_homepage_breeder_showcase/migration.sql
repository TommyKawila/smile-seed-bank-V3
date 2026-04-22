-- Split breeder icon grid from ribbon: new section key + clearer labels.
INSERT INTO "homepage_sections" ("id", "key", "label_th", "label_en", "sort_order", "is_active")
VALUES (
  'hpsec_breeder_showcase',
  'breeder_showcase',
  'กริด Breeder เด่น (ไอคอน)',
  'Featured Breeders Grid (Icons)',
  11,
  true
) ON CONFLICT ("key") DO NOTHING;

UPDATE "homepage_sections"
SET
  "label_th" = 'แถบ Breeder บนสุด (สไลด์)',
  "label_en" = 'Top Breeders Bar (Slider)'
WHERE "key" = 'breeders';
