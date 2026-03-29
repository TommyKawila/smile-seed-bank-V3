-- Standardize products.flowering_type (autoflower | photoperiod) and sex_type (feminized | regular).
-- Legacy: flowering_type AUTO/PHOTO; sex_type could wrongly hold "Autoflower".

UPDATE public.products
SET flowering_type = 'autoflower'
WHERE flowering_type IS NOT NULL AND upper(trim(flowering_type)) = 'AUTO';

UPDATE public.products
SET flowering_type = 'photoperiod'
WHERE flowering_type IS NOT NULL AND upper(trim(flowering_type)) = 'PHOTO';

UPDATE public.products
SET
  flowering_type = 'autoflower',
  sex_type = CASE
    WHEN lower(coalesce(sex_type, '')) LIKE '%regular%'
      AND lower(coalesce(sex_type, '')) NOT LIKE '%fem%' THEN 'regular'
    ELSE 'feminized'
  END
WHERE sex_type IS NOT NULL
  AND (
    lower(trim(sex_type)) = 'autoflower'
    OR lower(sex_type) LIKE '%autoflower%'
  );

UPDATE public.products
SET sex_type = 'feminized'
WHERE sex_type IS NOT NULL
  AND (
    lower(sex_type) LIKE '%feminized%'
    OR lower(trim(sex_type)) IN ('fem', 'ff')
  );

UPDATE public.products
SET sex_type = 'regular'
WHERE sex_type IS NOT NULL
  AND lower(sex_type) LIKE '%regular%'
  AND lower(sex_type) NOT LIKE '%fem%';

UPDATE public.products
SET sex_type = NULL
WHERE sex_type IS NOT NULL
  AND lower(trim(sex_type)) NOT IN ('feminized', 'regular');
