-- Mirror of Prisma RLS lockdown (safe if table missing).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_seed_claim_submissions') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.gf_seed_claim_submissions FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.gf_seed_claim_submissions FROM authenticated;
    END IF;
    ALTER TABLE public.gf_seed_claim_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
