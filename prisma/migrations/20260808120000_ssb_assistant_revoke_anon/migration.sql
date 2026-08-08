-- Harden ssb_assistant: revoke public PostgREST roles.
-- Prior migration granted ALL to anon/authenticated while docs require exposing
-- the schema — together that lets anyone with the public anon key read/write
-- founder chat history (session tommy), knowledge embeddings, and persona.

REVOKE ALL ON ALL TABLES IN SCHEMA ssb_assistant FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA ssb_assistant FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ssb_assistant FROM anon, authenticated;
REVOKE USAGE ON SCHEMA ssb_assistant FROM anon, authenticated;

GRANT USAGE ON SCHEMA ssb_assistant TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ssb_assistant TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA ssb_assistant TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ssb_assistant TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  REVOKE ALL ON ROUTINES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  GRANT ALL ON ROUTINES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  GRANT ALL ON SEQUENCES TO service_role;

-- Defense in depth: enable RLS with no anon/authenticated policies (deny-all).
-- service_role bypasses RLS; app access remains via SUPABASE_SERVICE_ROLE_KEY only.
DO $$
BEGIN
  IF to_regclass('ssb_assistant.chat_history') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE ssb_assistant.chat_history ENABLE ROW LEVEL SECURITY';
  END IF;
  IF to_regclass('ssb_assistant.long_term_memories') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE ssb_assistant.long_term_memories ENABLE ROW LEVEL SECURITY';
  END IF;
  IF to_regclass('ssb_assistant.user_profile') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE ssb_assistant.user_profile ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
