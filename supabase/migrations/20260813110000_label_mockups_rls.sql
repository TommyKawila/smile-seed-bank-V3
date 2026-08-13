-- label_mockups shipped after 20260812160000 partner/B2B RLS lockdown without RLS.
-- Share links are UUID-gated via Prisma; PostgREST must not list or mutate the table.
-- Same pattern as partner lockdown: ENABLE RLS, no anon/authenticated policies.
-- Prisma / service_role / table-owner still serve GET /share/mockup/[id].

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'label_mockups'
  ) THEN
    ALTER TABLE public.label_mockups ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
