ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS customer_address TEXT;
