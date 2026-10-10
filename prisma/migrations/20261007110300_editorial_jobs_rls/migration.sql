-- editorial_jobs holds unpublished drafts, source prompts, and review notes.
-- ENABLE RLS with no anon/authenticated policies → PostgREST anon cannot read/write.
-- Prisma / service_role / table owner continue to work.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.editorial_jobs FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.editorial_jobs FROM authenticated;
  END IF;
END $$;

ALTER TABLE "public"."editorial_jobs" ENABLE ROW LEVEL SECURITY;
