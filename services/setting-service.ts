import { createServiceRoleClient } from "@/lib/supabase/server";

export type UpsertSiteSettingResult =
  | { ok: true }
  | { ok: false; error: string };

/** Server-only: writes `site_settings` with service role (bypasses RLS). */
export async function upsertSiteSetting(
  key: string,
  value: string
): Promise<UpsertSiteSettingResult> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Server-only: full key/value map for admin GET. */
export async function getSiteSettingsRecordMap(): Promise<Record<string, string>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((acc, row) => {
    acc[row.key] = row.value ?? "";
    return acc;
  }, {} as Record<string, string>);
}
