import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STOREFRONT_SITE_SETTING_KEYS } from "@/lib/storefront-site-setting-keys";

export const dynamic = "force-dynamic";

/**
 * Public read of `site_settings` (RLS + .in filter: logos, hero_bg_mode, hero_svg_code, company, legal, social).
 * Storefront + emails use this instead of `/api/admin/settings` (middleware blocks non-admin).
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [...STOREFRONT_SITE_SETTING_KEYS]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
