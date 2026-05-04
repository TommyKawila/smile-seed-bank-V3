import { updateSiteSettingAction } from "@/app/actions/site-settings";

export type SocialLink = { platform: string; handle: string };

export interface SiteSettings {
  logo_main_url?: string;
  logo_secondary_png_url?: string;
  site_name?: string;
  hero_bg_mode?: "static_image" | "video" | "animated_svg";
  hero_svg_code?: string;
  hero_static_image_url?: string;
  hero_video_url?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  social_media?: string;
  legal_seed_license_url?: string;
  legal_seed_license_number?: string;
  legal_business_registration_url?: string;
  legal_business_registration_number?: string;
}

export async function fetchSiteSettings(useAdmin: boolean): Promise<SiteSettings> {
  const res = await fetch(useAdmin ? "/api/admin/settings" : "/api/storefront/site-settings");
  if (!res.ok) return {};
  return (await res.json()) as SiteSettings;
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  const result = await updateSiteSettingAction(key, value);
  if (!result.ok) throw new Error(result.error ?? "Update failed");
}

export function parseSocialLinks(settings: SiteSettings): SocialLink[] {
  try {
    const raw = settings.social_media;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SocialLink[]) : [];
  } catch {
    return [];
  }
}
