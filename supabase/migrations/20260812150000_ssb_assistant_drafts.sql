-- Optional drafts + ensure grants for ssb_assistant assistant_drafts
-- Run in Supabase SQL editor if table missing. Safe to re-run.

CREATE TABLE IF NOT EXISTS ssb_assistant.assistant_drafts (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'admin',
  channel_hint TEXT NOT NULL DEFAULT 'generic',
  order_id TEXT,
  body_th TEXT,
  body_en TEXT,
  raw_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_drafts_session_created
  ON ssb_assistant.assistant_drafts (session_id, created_at DESC);

GRANT ALL ON TABLE ssb_assistant.assistant_drafts TO service_role, authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE ssb_assistant.assistant_drafts_id_seq TO service_role, authenticated, anon;
