CREATE TABLE IF NOT EXISTS "dynamic_banners" (
  "id" BIGSERIAL PRIMARY KEY,
  "title_th" TEXT,
  "title_en" TEXT,
  "desktop_image_th" TEXT NOT NULL DEFAULT '',
  "desktop_image_en" TEXT NOT NULL DEFAULT '',
  "mobile_image_th" TEXT NOT NULL DEFAULT '',
  "mobile_image_en" TEXT NOT NULL DEFAULT '',
  "link_url" TEXT,
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "dynamic_banners_active_order_idx"
  ON "dynamic_banners" ("is_active", "order_index", "id");
