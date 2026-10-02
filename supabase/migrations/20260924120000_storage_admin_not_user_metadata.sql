-- payment-slips / payments SELECT must not trust user_metadata.role.
-- Authenticated users can set that claim via auth.updateUser({ data: { role: 'ADMIN' } }).
-- Admin listing is customers.role, read in a definer function so customers RLS cannot hide it.

CREATE OR REPLACE FUNCTION public.is_storage_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers
    WHERE id = auth.uid()
      AND role = 'ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION public.is_storage_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_storage_admin() TO authenticated, service_role;

DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage.objects missing — skip slip admin policy';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "payment_slips_select_authorized" ON storage.objects';
  EXECUTE $pol$
    CREATE POLICY "payment_slips_select_authorized"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'payment-slips'
        AND (
          public.is_storage_admin()
          OR EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.order_number = split_part(name, '-', 1)
              AND o.customer_id = auth.uid()
          )
        )
      )
  $pol$;

  EXECUTE 'DROP POLICY IF EXISTS "payments_select_authorized" ON storage.objects';
  EXECUTE $pol$
    CREATE POLICY "payments_select_authorized"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'payments'
        AND (
          public.is_storage_admin()
          OR EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.order_number = split_part(name, '-', 1)
              AND o.customer_id = auth.uid()
          )
        )
      )
  $pol$;
END $$;
