-- Split-hero panel backdrop (optional hex behind carousel image)
ALTER TABLE "hero_banners" ADD COLUMN IF NOT EXISTS "panel_bg_hex" TEXT;
