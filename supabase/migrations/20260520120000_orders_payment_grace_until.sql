ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_grace_until TIMESTAMPTZ;
