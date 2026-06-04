-- Catalog genetics filter: is_active + strain_dominance
CREATE INDEX IF NOT EXISTS idx_products_active_strain_dominance
  ON public.products (is_active, strain_dominance)
  WHERE is_active = true;

-- Backfill strain_dominance from ratio columns (idempotent)
UPDATE public.products
SET strain_dominance = 'Mostly Sativa'
WHERE (strain_dominance IS NULL OR btrim(strain_dominance) = '')
  AND sativa_ratio IS NOT NULL
  AND indica_ratio IS NOT NULL
  AND sativa_ratio >= 60
  AND sativa_ratio > indica_ratio;

UPDATE public.products
SET strain_dominance = 'Mostly Indica'
WHERE (strain_dominance IS NULL OR btrim(strain_dominance) = '')
  AND sativa_ratio IS NOT NULL
  AND indica_ratio IS NOT NULL
  AND indica_ratio >= 60
  AND indica_ratio > sativa_ratio;

UPDATE public.products
SET strain_dominance = 'Hybrid 50/50'
WHERE (strain_dominance IS NULL OR btrim(strain_dominance) = '')
  AND sativa_ratio IS NOT NULL
  AND indica_ratio IS NOT NULL
  AND abs(sativa_ratio - indica_ratio) <= 15;
