-- GF seed claim intake — RLS lockdown (Prisma / service_role only; no anon policies)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gf_seed_claim_submissions'
  ) THEN
    ALTER TABLE public.gf_seed_claim_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
