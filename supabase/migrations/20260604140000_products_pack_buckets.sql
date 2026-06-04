-- Pack filter buckets for shop `seeds=` URL (1,2,3,5,10,gt10,other)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pack_buckets text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_pack_buckets
  ON public.products USING GIN (pack_buckets);
