-- Optional schedule visibility for storefront carousel slides.
ALTER TABLE "dynamic_banners"
  ADD COLUMN "start_date" TIMESTAMPTZ(6),
  ADD COLUMN "end_date" TIMESTAMPTZ(6);
