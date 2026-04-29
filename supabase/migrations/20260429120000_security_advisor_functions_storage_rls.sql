-- Security Advisor: function EXECUTE, storage object listing, stock_snapshots RLS.

-- ─── RPC + trigger functions: EXECUTE only for authenticated + service_role ───

DO $$
DECLARE
  ident text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO ident
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'get_unused_coupons'
  LIMIT 1;

  IF ident IS NOT NULL THEN
    EXECUTE format('REVOKE ALL ON FUNCTION public.get_unused_coupons(%s) FROM PUBLIC', ident);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.get_unused_coupons(%s) TO authenticated, service_role', ident);
  END IF;

  SELECT pg_get_function_identity_arguments(p.oid) INTO ident
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'has_used_welcome_coupon'
  LIMIT 1;

  IF ident IS NOT NULL THEN
    EXECUTE format('REVOKE ALL ON FUNCTION public.has_used_welcome_coupon(%s) FROM PUBLIC', ident);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.has_used_welcome_coupon(%s) TO authenticated, service_role', ident);
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.sync_customer_role_to_auth_user_metadata() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_customer_role_to_auth_user_metadata() TO authenticated, service_role;

-- ─── Storage: scoped SELECT on payment slips (restricts bucket listing for non-admins) ───
-- Customers only see objects whose key starts with their order_number (path: ORDERNUM-timestamp.ext).
-- ADMIN (user_metadata.role) can read/list all objects in these buckets. service_role bypasses RLS.
-- Anonymous JWT has no policy here → cannot list or read via Storage API (public bucket CDN GET may still work).

DROP POLICY IF EXISTS "payment_slips_select_authorized" ON storage.objects;
CREATE POLICY "payment_slips_select_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-slips'
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
      OR EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.order_number = split_part(name, '-', 1)
          AND o.customer_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "payments_select_authorized" ON storage.objects;
CREATE POLICY "payments_select_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payments'
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
      OR EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.order_number = split_part(name, '-', 1)
          AND o.customer_id = auth.uid()
      )
    )
  );

-- ─── stock_snapshots: not storefront-public; enable RLS (no anon/authenticated policies) ───
-- Admin/inventory uses Prisma with a privileged DB role (bypasses RLS). store_settings unchanged — public SELECT per prior migration.

ALTER TABLE public.stock_snapshots ENABLE ROW LEVEL SECURITY;
