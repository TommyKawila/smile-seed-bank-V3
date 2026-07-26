ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_kind text NOT NULL DEFAULT 'seed',
  ADD COLUMN IF NOT EXISTS merch_category text;

CREATE INDEX IF NOT EXISTS idx_products_product_kind_breeder
  ON public.products (product_kind, breeder_id);

CREATE INDEX IF NOT EXISTS idx_products_product_kind_merch_category
  ON public.products (product_kind, merch_category);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_merch_category_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_merch_category_check
      CHECK (
        product_kind <> 'merch'
        OR merch_category IN ('tees', 'caps', 'pins', 'stickers')
      );
  END IF;
END $$;
