-- Lock down tables flagged by Supabase Advisor (RLS Disabled in Public).
-- Pattern: ENABLE RLS with no anon/authenticated policies → PostgREST anon cannot read/write.
-- Prisma / service_role / table-owner DB role continue to work (bypass or privileged).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'grower_tool_usage_logs',
    'business_contacts',
    'business_documents',
    'b2b_quote_yearly_seq',
    'b2b_quotes',
    'b2b_quote_items',
    'wholesale_settings',
    'wholesale_catalog_strains',
    'partner_suppliers',
    'partner_documents',
    'partner_strains',
    'partner_price_lists',
    'partner_price_tiers',
    'partner_coa_services'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'ssb_assistant' AND table_name = 'assistant_drafts'
  ) THEN
    REVOKE ALL ON TABLE ssb_assistant.assistant_drafts FROM anon, authenticated;
    GRANT ALL ON TABLE ssb_assistant.assistant_drafts TO service_role;
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'ssb_assistant' AND c.relname = 'assistant_drafts_id_seq'
    ) THEN
      REVOKE ALL ON SEQUENCE ssb_assistant.assistant_drafts_id_seq FROM anon, authenticated;
      GRANT USAGE, SELECT ON SEQUENCE ssb_assistant.assistant_drafts_id_seq TO service_role;
    END IF;
    ALTER TABLE ssb_assistant.assistant_drafts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
