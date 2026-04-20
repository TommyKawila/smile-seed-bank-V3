-- Manual coupon expiration (nullable). Safe if Prisma baseline already created the column.
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

COMMENT ON COLUMN public.promo_codes.expiry_date IS 'Coupon invalid after this timestamp (UTC); NULL = no expiry.';
