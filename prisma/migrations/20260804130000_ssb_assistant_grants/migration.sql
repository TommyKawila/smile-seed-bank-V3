-- Grants for PostgREST access to ssb_assistant (Telegram SSB Assistant).
-- Also add `ssb_assistant` under Supabase Dashboard → Settings → API → Exposed schemas.

GRANT USAGE ON SCHEMA ssb_assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ssb_assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA ssb_assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ssb_assistant TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
