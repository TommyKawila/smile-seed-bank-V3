-- Cabinet storage log — RLS lockdown (Prisma / service_role only; no anon policies)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cabinet_storage_log_entries'
  ) THEN
    ALTER TABLE public.cabinet_storage_log_entries ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cabinet_storage_share'
  ) THEN
    ALTER TABLE public.cabinet_storage_share ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
