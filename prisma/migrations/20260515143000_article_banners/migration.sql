-- Dedicated article promo banners (Marketing Hub); storefront prefers this over promotion_campaigns.

CREATE TABLE "article_banners" (
    "id" BIGSERIAL NOT NULL,
    "desktop_image_url" TEXT,
    "mobile_image_url" TEXT,
    "title_alt" TEXT NOT NULL DEFAULT '',
    "destination_url" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_banners_active_sort_idx" ON "article_banners" ("active", "sort_order", "id");
