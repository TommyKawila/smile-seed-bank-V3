-- Lock down wholesale deposit tables (created in 20261002043000 without RLS).
-- Pattern: ENABLE RLS, no anon/authenticated policies → PostgREST cannot dump
-- grower PII or mark a deposit VERIFIED. Prisma / table-owner / service_role
-- continue to read/write via /api/wholesale/deposit-* and /api/admin/wholesale/deposits.

ALTER TABLE "public"."wholesale_deposit_yearly_seq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wholesale_deposit_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wholesale_deposit_order_items" ENABLE ROW LEVEL SECURITY;
