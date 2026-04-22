-- Storefront search analytics (admin dashboard top terms)
CREATE TABLE IF NOT EXISTS public.search_logs (
  id BIGSERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs (created_at);

COMMENT ON TABLE public.search_logs IS 'Normalized search queries from /api/storefront/search-suggest';
