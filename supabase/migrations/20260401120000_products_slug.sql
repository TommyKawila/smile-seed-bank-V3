-- SEO-friendly product URLs (nullable until backfilled)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);
