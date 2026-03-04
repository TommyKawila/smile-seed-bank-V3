-- Bypass PostgREST cache: new table for direct SQL access
CREATE TABLE IF NOT EXISTS public.tiered_discounts_v4 (
  id SERIAL PRIMARY KEY,
  min_spend INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

GRANT ALL ON TABLE public.tiered_discounts_v4 TO service_role;
GRANT SELECT ON TABLE public.tiered_discounts_v4 TO authenticated;
GRANT SELECT ON TABLE public.tiered_discounts_v4 TO anon;
