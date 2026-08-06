import { revalidateTag } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { STOREFRONT_SITE_SETTINGS_CACHE_TAG } from "@/lib/storefront-site-setting-keys";
import {
  resolveGrowerToolAiEnabled,
  resolveGrowerToolsAiFlags,
  type GrowerToolAiAction,
  type GrowerToolAiFlags,
} from "@/lib/grower-tools-settings";

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
  revalidateTag(STOREFRONT_SITE_SETTINGS_CACHE_TAG);
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

/** Server-only: per-tool AI flags for storefront grower tools. Default all true. */
export async function getGrowerToolsAiFlags(): Promise<GrowerToolAiFlags> {
  const map = await getSiteSettingsRecordMap();
  return resolveGrowerToolsAiFlags(map);
}

export async function isGrowerToolAiEnabled(action: GrowerToolAiAction): Promise<boolean> {
  const map = await getSiteSettingsRecordMap();
  return resolveGrowerToolAiEnabled(map, action);
}

/** @deprecated Use getGrowerToolsAiFlags / isGrowerToolAiEnabled */
export async function getGrowerToolsAiEnabled(): Promise<boolean> {
  const flags = await getGrowerToolsAiFlags();
  return flags.soilMixer && flags.fertilizer && flags.plantDoctor;
}
