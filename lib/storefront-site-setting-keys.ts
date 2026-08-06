/**
 * Keys readable by anon on `site_settings` — keep in sync with
 * supabase/migrations/20260331120000_site_store_settings_public_select_rls.sql (USING key IN (...)).
 */
export const STOREFRONT_SITE_SETTING_KEYS = [
  "logo_main_url",
  "logo_secondary_png_url",
  "site_name",
  "hero_bg_mode",
  "hero_svg_code",
  "hero_static_image_url",
  "hero_video_url",
  "company_name",
  "company_address",
  "company_email",
  "company_phone",
  "social_media",
  "legal_seed_license_url",
  "legal_seed_license_number",
  "legal_business_registration_url",
  "legal_business_registration_number",
] as const;

/** Next Data Cache tag for SSR storefront site_settings (layout TTFB). */
export const STOREFRONT_SITE_SETTINGS_CACHE_TAG = "storefront-site-settings";
