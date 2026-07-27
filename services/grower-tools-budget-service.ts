import "server-only";

import {
  GROWER_TOOLS_AI_DISABLE_KEYS,
  GROWER_TOOLS_BUDGET_KEYS,
  resolveGrowerToolsBudgetConfig,
  type GrowerToolsBudgetConfig,
} from "@/lib/grower-tools-budget-settings";
import {
  getDailySpend,
  getMonthlySpend,
} from "@/services/grower-tools-usage-service";
import {
  getSiteSettingsRecordMap,
  upsertSiteSetting,
} from "@/services/setting-service";

export type BudgetCheckResult =
  | { ok: true; config: GrowerToolsBudgetConfig; dailySpend: number; monthlySpend: number }
  | { ok: false; reason: "budget_exceeded"; config: GrowerToolsBudgetConfig; dailySpend: number; monthlySpend: number };

export async function checkGrowerToolsBudget(): Promise<BudgetCheckResult> {
  const settings = await getSiteSettingsRecordMap();
  const config = resolveGrowerToolsBudgetConfig(settings);
  const [dailySpend, monthlySpend] = await Promise.all([
    getDailySpend(),
    getMonthlySpend(),
  ]);

  if (
    config.autoDisable &&
    (dailySpend >= config.dailyUsd || monthlySpend >= config.monthlyUsd)
  ) {
    return {
      ok: false,
      reason: "budget_exceeded",
      config,
      dailySpend,
      monthlySpend,
    };
  }

  return { ok: true, config, dailySpend, monthlySpend };
}

/** Disable all AI tools + record trip timestamp (idempotent). */
export async function tripGrowerToolsBudget(): Promise<void> {
  const settings = await getSiteSettingsRecordMap();
  if (settings[GROWER_TOOLS_BUDGET_KEYS.trippedAt]) return;

  const now = new Date().toISOString();
  await upsertSiteSetting(GROWER_TOOLS_BUDGET_KEYS.trippedAt, now);
  for (const key of GROWER_TOOLS_AI_DISABLE_KEYS) {
    await upsertSiteSetting(key, "false");
  }
}

/** Admin reset: clear trip + re-enable all AI tools. */
export async function resetGrowerToolsBudgetTrip(): Promise<void> {
  await upsertSiteSetting(GROWER_TOOLS_BUDGET_KEYS.trippedAt, "");
  for (const key of GROWER_TOOLS_AI_DISABLE_KEYS) {
    await upsertSiteSetting(key, "true");
  }
}
