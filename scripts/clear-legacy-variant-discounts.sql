-- One-off: reset legacy per-variant flash discounts. Storefront pricing uses `brand_promotions` + list `price` only.
UPDATE public.product_variants
SET
  discount_percent = 0,
  discount_ends_at = NULL;
