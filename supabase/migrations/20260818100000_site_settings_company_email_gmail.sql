-- Correct public contact email (B2B / documents use smileseedsbank@gmail.com)
UPDATE public.site_settings
SET value = 'smileseedsbank@gmail.com', updated_at = now()
WHERE key = 'company_email'
  AND (value IS NULL OR trim(value) = '' OR lower(trim(value)) = 'contact@smileseedbank.com');

INSERT INTO public.site_settings (key, value, updated_at)
SELECT 'company_email', 'smileseedsbank@gmail.com', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_settings WHERE key = 'company_email'
);
