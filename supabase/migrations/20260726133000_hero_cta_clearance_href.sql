-- Point hero Clearance CTA to dedicated landing page
UPDATE public.homepage_hero_cta_buttons
SET
  href = '/clearance',
  updated_at = NOW()
WHERE
  id = 'hero_cta_clearance'
  OR href ILIKE '%quick=clearance%'
  OR href ILIKE '%filter=clearance%';
