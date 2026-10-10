-- Lock down tables: ENABLE RLS + REVOKE anon/authenticated (PostgREST).
-- Prisma / table-owner / service_role continue via server APIs.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.wholesale_deposit_yearly_seq FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.wholesale_deposit_yearly_seq FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.wholesale_deposit_orders FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.wholesale_deposit_orders FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.wholesale_deposit_order_items FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.wholesale_deposit_order_items FROM authenticated;
  END IF;
END $$;

ALTER TABLE "public"."wholesale_deposit_yearly_seq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wholesale_deposit_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wholesale_deposit_order_items" ENABLE ROW LEVEL SECURITY;
