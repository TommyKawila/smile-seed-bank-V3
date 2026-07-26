-- Hero Clearance CTA → dedicated /clearance landing
UPDATE public.homepage_hero_cta_buttons
SET
  href = '/clearance',
  updated_at = NOW()
WHERE id = 'hero_cta_clearance';
