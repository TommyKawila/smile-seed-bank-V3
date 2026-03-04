-- Coupon Usage Limits (Anti-Fraud)
-- coupon_redemptions: tracks each redemption per email/user
-- promo_codes: add usage_limit_per_user (default 1)

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_email ON coupon_redemptions(coupon_id, email);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_user ON coupon_redemptions(coupon_id, user_id);

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS usage_limit_per_user INTEGER DEFAULT 1;

GRANT ALL ON coupon_redemptions TO service_role;
GRANT SELECT ON coupon_redemptions TO authenticated;
GRANT SELECT ON coupon_redemptions TO anon;
