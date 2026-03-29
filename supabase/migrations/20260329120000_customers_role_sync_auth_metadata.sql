-- Mirror public.customers.role into auth.users.raw_user_meta_data under key "role".
-- Enables session.user.user_metadata.role after the JWT is refreshed (e.g. getSession / onAuthStateChange).

CREATE OR REPLACE FUNCTION public.sync_customer_role_to_auth_user_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', to_jsonb(NEW.role))
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_customer_role_to_auth_user_metadata() FROM PUBLIC;

DROP TRIGGER IF EXISTS customers_sync_role_to_auth_user_metadata ON public.customers;

CREATE TRIGGER customers_sync_role_to_auth_user_metadata
  AFTER INSERT OR UPDATE OF role ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_role_to_auth_user_metadata();
