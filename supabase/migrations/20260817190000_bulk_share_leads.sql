-- Bulk share leads — RLS lockdown (Prisma / service_role only; no anon policies)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bulk_share_lead_yearly_seq'
  ) THEN
    ALTER TABLE public.bulk_share_lead_yearly_seq ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bulk_share_leads'
  ) THEN
    ALTER TABLE public.bulk_share_leads ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bulk_share_lead_items'
  ) THEN
    ALTER TABLE public.bulk_share_lead_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
