-- Add expiry_date to promo_codes (NULL = no expiry)
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
