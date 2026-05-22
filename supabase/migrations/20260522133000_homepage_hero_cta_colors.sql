-- Hero CTA: migrate legacy variant values to brand color tokens

UPDATE public.homepage_hero_cta_buttons
SET variant = 'green'
WHERE variant = 'primary';
