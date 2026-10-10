-- Lock down tables: ENABLE RLS + REVOKE anon/authenticated (PostgREST).
-- Prisma / table-owner / service_role continue via server APIs.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.cabinet_storage_log_entries FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.cabinet_storage_log_entries FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.cabinet_storage_share FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.cabinet_storage_share FROM authenticated;
  END IF;
END $$;

ALTER TABLE "public"."cabinet_storage_log_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cabinet_storage_share" ENABLE ROW LEVEL SECURITY;
