-- Labels-only section for QuickCategoryNav (rendered inside hero stack; map uses `case 'categories': null`).
INSERT INTO "homepage_sections" ("id", "key", "label_th", "label_en", "sort_order", "is_active")
VALUES (
  'hpsec_categories',
  'categories',
  'เลือกสไตล์การปลูก',
  'Find your grow style',
  10,
  true
) ON CONFLICT ("key") DO NOTHING;
