-- Merge duplicate "Rainbow Melon" products: repoint historical rows to Fast Buds product, delete null-breeder orphans.
-- Run Step 1 (diagnosis) first. Then review Step 2 output from the dry-run SELECT inside the DO block, or run Step 3.
-- WARNING: Deleting orphan products CASCADE-deletes their product_variants. Merge stock/SKU manually first if needed.

-- =============================================================================
-- Step 1 — Diagnosis (read-only)
-- =============================================================================
SELECT
  p.id,
  trim(p.name) AS name,
  p.breeder_id,
  b.name AS breeder_name,
  (SELECT COUNT(*)::int FROM public.order_items oi WHERE oi.product_id = p.id) AS order_items,
  (SELECT COUNT(*)::int FROM public.quotation_items qi WHERE qi.product_id = p.id) AS quotation_items,
  (SELECT COUNT(*)::int FROM public.product_variants pv WHERE pv.product_id = p.id) AS variants
FROM public.products p
LEFT JOIN public.breeders b ON b.id = p.breeder_id
WHERE trim(p.name) ILIKE 'Rainbow Melon'
ORDER BY p.id;

-- =============================================================================
-- Step 2 — Dry-run counts (read-only): what the merge will touch
-- =============================================================================
WITH canonical AS (
  SELECT p.id AS canonical_id
  FROM public.products p
  INNER JOIN public.breeders b ON b.id = p.breeder_id
  WHERE trim(p.name) ILIKE 'Rainbow Melon'
    AND b.name ILIKE '%Fast Buds%'
  ORDER BY p.id
  LIMIT 1
),
orphans AS (
  SELECT p.id AS orphan_id
  FROM public.products p
  WHERE trim(p.name) ILIKE 'Rainbow Melon'
    AND p.breeder_id IS NULL
)
SELECT c.canonical_id,
       array_agg(o.orphan_id ORDER BY o.orphan_id) AS orphan_ids,
       (SELECT COUNT(*) FROM public.order_items oi WHERE oi.product_id IN (SELECT orphan_id FROM orphans)) AS order_items_to_update,
       (SELECT COUNT(*) FROM public.quotation_items qi WHERE qi.product_id IN (SELECT orphan_id FROM orphans)) AS quotation_items_to_update
FROM canonical c
LEFT JOIN orphans o ON true
GROUP BY c.canonical_id;

-- =============================================================================
-- Step 3 — Execute merge + delete (transaction)
-- =============================================================================
BEGIN;

DO $$
DECLARE
  canon bigint;
  orphan_ids bigint[];
  n_canon int;
BEGIN
  SELECT COUNT(*) INTO n_canon
  FROM public.products p
  INNER JOIN public.breeders b ON b.id = p.breeder_id
  WHERE trim(p.name) ILIKE 'Rainbow Melon'
    AND b.name ILIKE '%Fast Buds%';

  IF n_canon = 0 THEN
    RAISE EXCEPTION 'merge-rainbow-melon: no product named Rainbow Melon linked to Fast Buds';
  END IF;
  IF n_canon > 1 THEN
    RAISE EXCEPTION 'merge-rainbow-melon: multiple Rainbow Melon rows for Fast Buds — pick one canonical id manually';
  END IF;

  SELECT p.id INTO canon
  FROM public.products p
  INNER JOIN public.breeders b ON b.id = p.breeder_id
  WHERE trim(p.name) ILIKE 'Rainbow Melon'
    AND b.name ILIKE '%Fast Buds%'
  ORDER BY p.id
  LIMIT 1;

  SELECT array_agg(p.id ORDER BY p.id)
  INTO orphan_ids
  FROM public.products p
  WHERE trim(p.name) ILIKE 'Rainbow Melon'
    AND p.breeder_id IS NULL;

  IF orphan_ids IS NULL OR COALESCE(cardinality(orphan_ids), 0) = 0 THEN
    RAISE NOTICE 'merge-rainbow-melon: no orphan (breeder_id NULL) rows — nothing to merge';
    RETURN;
  END IF;

  IF canon = ANY (orphan_ids) THEN
    RAISE EXCEPTION 'merge-rainbow-melon: logic error — canonical id in orphan set';
  END IF;

  UPDATE public.order_items oi
  SET product_id = canon
  WHERE oi.product_id = ANY (orphan_ids);

  UPDATE public.quotation_items qi
  SET product_id = canon,
      breeder_name = COALESCE((SELECT b.name FROM public.breeders b INNER JOIN public.products p ON p.breeder_id = b.id WHERE p.id = canon LIMIT 1), qi.breeder_name)
  WHERE qi.product_id = ANY (orphan_ids);

  DELETE FROM public.products p WHERE p.id = ANY (orphan_ids);

  RAISE NOTICE 'merge-rainbow-melon: canonical_id=%, deleted orphan ids=%', canon, orphan_ids;
END $$;

COMMIT;

-- =============================================================================
-- Dashboard: hard refresh the admin dashboard (or change date range) to refetch GET /api/admin/dashboard/stats
-- =============================================================================
