-- Admin-facing label: home "featured" section is now FeaturedProductHero (vault-style carousel).
UPDATE "homepage_sections"
SET
  "label_th" = 'สายพันธุ์เด่น (Featured Hero)',
  "label_en" = 'Featured strain hero'
WHERE "key" = 'featured';
