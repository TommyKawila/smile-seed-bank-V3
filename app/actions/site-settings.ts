"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertSiteSetting } from "@/services/setting-service";

export async function updateSiteSettingAction(key: string, value: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!key?.trim() || value === undefined) {
    return { ok: false as const, error: "key and value required" };
  }
  return upsertSiteSetting(key.trim(), value);
}
