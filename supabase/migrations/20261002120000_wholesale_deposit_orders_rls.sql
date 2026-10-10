-- Mirror of Prisma RLS lockdown (safe if table missing).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wholesale_deposit_yearly_seq') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.wholesale_deposit_yearly_seq FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.wholesale_deposit_yearly_seq FROM authenticated;
    END IF;
    ALTER TABLE public.wholesale_deposit_yearly_seq ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wholesale_deposit_orders') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.wholesale_deposit_orders FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.wholesale_deposit_orders FROM authenticated;
    END IF;
    ALTER TABLE public.wholesale_deposit_orders ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wholesale_deposit_order_items') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.wholesale_deposit_order_items FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.wholesale_deposit_order_items FROM authenticated;
    END IF;
    ALTER TABLE public.wholesale_deposit_order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
