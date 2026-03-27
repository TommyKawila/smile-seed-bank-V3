-- Ensure order financial columns exist (idempotent for DBs that skipped earlier migrations)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Align precision with Prisma @db.Decimal(12, 2)
ALTER TABLE public.orders ALTER COLUMN total_amount TYPE NUMERIC(12, 2);
ALTER TABLE public.orders ALTER COLUMN total_cost TYPE NUMERIC(12, 2);
