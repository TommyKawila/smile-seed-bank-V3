UPDATE public.quotations SET shipping_cost = 0 WHERE shipping_cost IS NULL;
UPDATE public.quotations SET total_amount = 0 WHERE total_amount IS NULL;

ALTER TABLE public.quotations
  ALTER COLUMN shipping_cost SET DEFAULT 0,
  ALTER COLUMN shipping_cost SET NOT NULL;

ALTER TABLE public.quotations
  ALTER COLUMN total_amount SET DEFAULT 0;
