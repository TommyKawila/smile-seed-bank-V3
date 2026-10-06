-- AI Editorial Pipeline v1: draft jobs stay off blog_posts until publish

CREATE TABLE IF NOT EXISTS "public"."editorial_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'IDEA',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "approved_revision" INTEGER,
    "title" TEXT,
    "slug" TEXT,
    "excerpt" TEXT,
    "content" JSON,
    "title_en" TEXT,
    "excerpt_en" TEXT,
    "content_en" JSON,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category_id" BIGINT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "research_summary" TEXT,
    "sources" JSON,
    "image_plan" JSON,
    "featured_image" TEXT,
    "image_assets" JSON,
    "source_prompt" TEXT,
    "review_notes" TEXT,
    "published_post_id" BIGINT,
    "approved_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editorial_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "editorial_jobs_status_idx"
  ON "public"."editorial_jobs"("status");
CREATE INDEX IF NOT EXISTS "editorial_jobs_published_post_id_idx"
  ON "public"."editorial_jobs"("published_post_id");
