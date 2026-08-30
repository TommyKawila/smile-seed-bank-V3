-- Expose wholesale_hero_image_url to anon/authenticated SELECT (wholesale hero photo)
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
      'hero_video_url',
      'company_name',
      'company_address',
      'company_email',
      'company_phone',
      'social_media',
      'legal_seed_license_url',
      'legal_seed_license_number',
      'legal_company_seed_license_url',
      'legal_company_seed_license_number',
      'legal_company_business_registration_url',
      'legal_company_business_registration_number',
      'legal_business_registration_url',
      'legal_business_registration_number',
      'shipping_pause_enabled',
      'shipping_pause_from',
      'shipping_pause_until',
      'shipping_pause_message_th',
      'shipping_pause_message_en',
      'wholesale_hero_image_url'
    )
  );
