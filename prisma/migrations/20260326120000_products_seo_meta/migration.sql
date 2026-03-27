-- AI Importer: structured SEO metadata (TH/EN titles & descriptions)
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "seo_meta" JSONB;
