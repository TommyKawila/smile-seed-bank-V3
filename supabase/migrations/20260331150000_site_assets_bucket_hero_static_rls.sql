-- Public bucket for site-wide hero / marketing assets (upload via admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow storefront to read hero_static_image_url in site_settings
DROP POLICY IF EXISTS "site_settings_select_public_safe_keys" ON public.site_settings;

CREATE POLICY "site_settings_select_public_safe_keys"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'logo_main_url',
      'logo_secondary_png_url',
      'site_name',
      'hero_bg_mode',
      'hero_svg_code',
      'hero_static_image_url',
      'company_name',
      'company_address',
      'company_email',
      'company_phone',
      'social_media',
      'legal_seed_license_url',
      'legal_seed_license_number',
      'legal_business_registration_url',
      'legal_business_registration_number'
    )
  );
