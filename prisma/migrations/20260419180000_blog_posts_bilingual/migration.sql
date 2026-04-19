-- Bilingual magazine fields (TH primary, optional EN)
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "title_en" TEXT;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "content_en" JSONB;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "excerpt_en" TEXT;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "tagline_en" TEXT;
