-- Tiered Discount Rules: Dynamic spend-based tiers
-- Run in Supabase SQL Editor to fix "Table not found in schema cache"

CREATE TABLE IF NOT EXISTS public.tiered_discount_rules (
  id SERIAL PRIMARY KEY,
  min_spend INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Grant permissions to bypass schema cache error
GRANT ALL ON TABLE public.tiered_discount_rules TO service_role;
GRANT SELECT ON TABLE public.tiered_discount_rules TO authenticated;
GRANT SELECT ON TABLE public.tiered_discount_rules TO anon;

-- RPC functions to bypass schema cache (direct SQL)
DROP FUNCTION IF EXISTS public.save_tiered_discount_rules(jsonb);
DROP FUNCTION IF EXISTS public.get_tiered_discount_rules();

CREATE OR REPLACE FUNCTION public.get_tiered_discount_rules()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY min_spend), '[]'::json)
  FROM (SELECT min_spend, discount_percent FROM public.tiered_discount_rules ORDER BY min_spend) t;
$$;

CREATE OR REPLACE FUNCTION public.save_tiered_discount_rules(p_rules jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r jsonb;
  i int := 0;
BEGIN
  DELETE FROM public.tiered_discount_rules;
  IF jsonb_array_length(p_rules) > 0 THEN
    FOR r IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
      i := i + 1;
      INSERT INTO public.tiered_discount_rules (min_spend, discount_percent, sort_order)
      VALUES (
        (r->>'min_spend')::int,
        (r->>'discount_percent')::int,
        i
      );
    END LOOP;
  END IF;
  RETURN public.get_tiered_discount_rules();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tiered_discount_rules() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tiered_discount_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tiered_discount_rules() TO anon;
GRANT EXECUTE ON FUNCTION public.save_tiered_discount_rules(jsonb) TO service_role;

-- Force PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Fix stale notification queue (Supabase docs)
SELECT pg_notification_queue_usage();
