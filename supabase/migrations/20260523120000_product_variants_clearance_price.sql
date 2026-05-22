-- Per-pack clearance sale price (admin sets per variant when is_clearance = true)
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS clearance_price numeric;

COMMENT ON COLUMN public.product_variants.clearance_price IS
  'Storefront clearance price for this pack; null when not on clearance or uses legacy product.sale_price ratio.';
