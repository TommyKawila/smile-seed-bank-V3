-- Add requires_auth and first_order_only to promo_codes
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS requires_auth BOOLEAN DEFAULT false;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS first_order_only BOOLEAN DEFAULT false;
