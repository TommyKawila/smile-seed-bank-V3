-- Safe re-run if prior migration was not applied on remote DB
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0;
