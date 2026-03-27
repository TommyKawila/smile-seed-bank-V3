ALTER TABLE public.orders ALTER COLUMN order_number TYPE VARCHAR(48);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source_quotation_number VARCHAR(48);
