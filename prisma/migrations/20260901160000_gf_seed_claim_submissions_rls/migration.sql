-- Lock down tables: ENABLE RLS + REVOKE anon/authenticated (PostgREST).
-- Prisma / table-owner / service_role continue via server APIs.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.gf_seed_claim_submissions FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.gf_seed_claim_submissions FROM authenticated;
  END IF;
END $$;

ALTER TABLE "public"."gf_seed_claim_submissions" ENABLE ROW LEVEL SECURITY;
