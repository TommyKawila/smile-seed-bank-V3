-- Hero New Arrivals CTA → dedicated /new landing
UPDATE public.homepage_hero_cta_buttons
SET
  href = '/new',
  updated_at = NOW()
WHERE
  id = 'hero_cta_new'
  OR href ILIKE '%sort=new_arrivals%'
  OR href ILIKE '%quick=new%'
  OR href ILIKE '%filter=new%';
