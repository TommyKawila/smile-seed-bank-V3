-- Hero fade carousel (top-of-home), separate from dynamic_banners promo strip.

CREATE TABLE IF NOT EXISTS "hero_banners" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "link_url" TEXT,
    "desktop_th" TEXT NOT NULL,
    "desktop_en" TEXT,
    "mobile_th" TEXT,
    "mobile_en" TEXT,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hero_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "hero_banners_active_sort_idx" ON "hero_banners" ("active", "sort_order", "id");
