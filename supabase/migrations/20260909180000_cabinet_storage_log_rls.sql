-- Mirror of Prisma RLS lockdown (safe if table missing).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cabinet_storage_log_entries') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.cabinet_storage_log_entries FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.cabinet_storage_log_entries FROM authenticated;
    END IF;
    ALTER TABLE public.cabinet_storage_log_entries ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cabinet_storage_share') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.cabinet_storage_share FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.cabinet_storage_share FROM authenticated;
    END IF;
    ALTER TABLE public.cabinet_storage_share ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
