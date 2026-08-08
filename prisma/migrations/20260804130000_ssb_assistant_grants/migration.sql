-- PostgREST access for ssb_assistant (Telegram / Admin SSB Assistant).
-- Schema must be listed under Supabase Dashboard → Settings → API → Exposed schemas
-- so the service-role client can reach it. Do NOT grant to anon/authenticated:
-- the browser ships NEXT_PUBLIC_SUPABASE_ANON_KEY; without RLS that would expose
-- chat_history / long_term_memories / user_profile (incl. shared session "tommy").

GRANT USAGE ON SCHEMA ssb_assistant TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ssb_assistant TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA ssb_assistant TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ssb_assistant TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ssb_assistant
  GRANT ALL ON TABLES TO service_role;
