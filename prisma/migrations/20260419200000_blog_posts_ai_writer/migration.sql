ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "raw_input" TEXT;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "ai_tone_mood" TEXT;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "ai_opening_closing" TEXT;
ALTER TABLE "public"."blog_posts" ADD COLUMN IF NOT EXISTS "ai_target_audience" TEXT;
