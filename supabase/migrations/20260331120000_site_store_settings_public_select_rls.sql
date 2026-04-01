-- Public storefront: anon + authenticated may SELECT only non-admin keys from site_settings.
-- Admin/discount keys (e.g. tiered_discount_*) remain visible only via service_role (bypasses RLS).
-- store_settings: single business row (logo, contact) — safe for public SELECT; Prisma uses DB role that bypasses RLS.

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON public.site_settings;

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

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_settings_public_select" ON public.store_settings;

CREATE POLICY "store_settings_select_public"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);
