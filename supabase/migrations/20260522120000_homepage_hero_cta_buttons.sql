-- Hero CTA buttons (home hero panel — admin drag/order + links)

CREATE TABLE IF NOT EXISTS public.homepage_hero_cta_buttons (
  id text PRIMARY KEY,
  label_th text NOT NULL,
  label_en text NOT NULL,
  href text NOT NULL,
  variant text NOT NULL DEFAULT 'outline',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_hero_cta_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY homepage_hero_cta_select_public
  ON public.homepage_hero_cta_buttons
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

INSERT INTO public.homepage_hero_cta_buttons (id, label_th, label_en, href, variant, sort_order, is_active)
VALUES
  ('hero_cta_all_seeds', 'เมล็ดพันธุ์ทั้งหมด', 'All Seeds', '/seeds', 'green', 0, true),
  ('hero_cta_new', 'เมล็ดพันธุ์มาใหม่', 'New Arrivals', '/shop?sort=new_arrivals', 'outline', 1, true),
  ('hero_cta_clearance', 'เมล็ดพันธุ์ลดราคา', 'Clearance Seeds', '/seeds?quick=clearance', 'outline', 2, true),
  ('hero_cta_blog', 'บทความน่าสนใจ', 'Featured Articles', '/blog', 'outline', 3, true)
ON CONFLICT (id) DO NOTHING;
