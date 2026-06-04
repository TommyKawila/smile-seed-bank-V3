-- Catalog CBD bucket filter (numeric; parsed from free-text cbd_percent)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cbd_percent_num DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_products_active_cbd_num
  ON public.products (is_active, cbd_percent_num)
  WHERE is_active = true AND cbd_percent_num IS NOT NULL;

UPDATE public.products
SET cbd_percent_num = (
  NULLIF(regexp_replace(COALESCE(cbd_percent::text, ''), '[^0-9.]', '', 'g'), '')
)::double precision
WHERE cbd_percent_num IS NULL
  AND cbd_percent IS NOT NULL
  AND btrim(COALESCE(cbd_percent::text, '')) <> '';
