"use server";

import { assertAdmin } from "@/lib/auth-utils";
import { upsertSiteSetting } from "@/services/setting-service";

export async function updateSiteSettingAction(key: string, value: string) {
  try {
    await assertAdmin();
  } catch {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!key?.trim() || value === undefined) {
    return { ok: false as const, error: "key and value required" };
  }
  return upsertSiteSetting(key.trim(), value);
}
