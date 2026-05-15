-- Hero banner bilingual titles for storefront image alt / SEO
ALTER TABLE "hero_banners" ADD COLUMN "title_th" TEXT NOT NULL DEFAULT '';
ALTER TABLE "hero_banners" ADD COLUMN "title_en" TEXT;

UPDATE "hero_banners" SET "title_th" = "name" WHERE "title_th" = '';
