-- Digital Magazine Phase 1: categories, affiliate links, blog_posts extensions

CREATE TABLE "blog_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

CREATE TABLE "affiliate_links" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform_name" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "blog_posts" ADD COLUMN "category_id" BIGINT;
ALTER TABLE "blog_posts" ADD COLUMN "is_highlight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "blog_posts" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "blog_posts" ADD COLUMN "manual_rank" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "blog_posts_category_id_idx" ON "blog_posts"("category_id");
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");
CREATE INDEX "blog_posts_is_highlight_idx" ON "blog_posts"("is_highlight");

INSERT INTO "site_settings" ("key", "value", "updated_at") VALUES ('magazine_trending_mode', 'auto', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "blog_categories" ("name", "slug", "description", "sort_order") VALUES ('General', 'general', 'Default category', 0)
ON CONFLICT ("slug") DO NOTHING;
