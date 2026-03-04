-- Hard bypass: new RPC name to force PostgREST schema cache refresh
CREATE OR REPLACE FUNCTION public.save_tiered_discounts_v2(p_rules jsonb)
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

GRANT EXECUTE ON FUNCTION public.save_tiered_discounts_v2(jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
