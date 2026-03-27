DO $$ BEGIN
  CREATE TYPE "public"."PromotionRuleType" AS ENUM ('DISCOUNT', 'BUY_X_GET_Y', 'FREEBIES', 'BUNDLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type "PromotionRuleType" NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB,
  discount_value DECIMAL(12,2)
);
