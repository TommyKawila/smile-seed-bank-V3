import { GROWER_TOOLS_AI_TOOL_KEYS } from "@/lib/grower-tools-settings";

export const GROWER_TOOLS_BUDGET_KEYS = {
  dailyUsd: "grower_tools_budget_daily_usd",
  monthlyUsd: "grower_tools_budget_monthly_usd",
  autoDisable: "grower_tools_budget_auto_disable",
  trippedAt: "grower_tools_budget_tripped_at",
} as const;

export const GROWER_TOOLS_BUDGET_DEFAULTS = {
  dailyUsd: 5,
  monthlyUsd: 50,
} as const;

export type GrowerToolsBudgetConfig = {
  dailyUsd: number;
  monthlyUsd: number;
  autoDisable: boolean;
  trippedAt: string | null;
};

export function parseBudgetUsd(value: string | undefined | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function resolveGrowerToolsBudgetConfig(
  settings: Record<string, string>
): GrowerToolsBudgetConfig {
  return {
    dailyUsd: parseBudgetUsd(
      settings[GROWER_TOOLS_BUDGET_KEYS.dailyUsd],
      GROWER_TOOLS_BUDGET_DEFAULTS.dailyUsd
    ),
    monthlyUsd: parseBudgetUsd(
      settings[GROWER_TOOLS_BUDGET_KEYS.monthlyUsd],
      GROWER_TOOLS_BUDGET_DEFAULTS.monthlyUsd
    ),
    autoDisable: settings[GROWER_TOOLS_BUDGET_KEYS.autoDisable] !== "false",
    trippedAt: settings[GROWER_TOOLS_BUDGET_KEYS.trippedAt]?.trim() || null,
  };
}

export const GROWER_TOOLS_AI_DISABLE_KEYS = [
  GROWER_TOOLS_AI_TOOL_KEYS.soilMixer,
  GROWER_TOOLS_AI_TOOL_KEYS.fertilizer,
  GROWER_TOOLS_AI_TOOL_KEYS.plantDoctor,
] as const;
