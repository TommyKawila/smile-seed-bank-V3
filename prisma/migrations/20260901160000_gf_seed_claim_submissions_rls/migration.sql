-- Lock down gf_seed_claim_submissions (created in 20260901150000 without RLS).
-- Pattern: ENABLE RLS, no anon/authenticated policies → PostgREST cannot dump PII.
-- Prisma / table-owner / service_role continue to insert via /api/storefront/claim/seeds.

ALTER TABLE "public"."gf_seed_claim_submissions" ENABLE ROW LEVEL SECURITY;
