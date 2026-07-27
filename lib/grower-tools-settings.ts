export type GrowerToolAiAction = "soil-mixer" | "fertilizer" | "plant-doctor";

/** @deprecated Legacy master — use per-tool keys; still honored as fallback */
export const GROWER_TOOLS_AI_SETTING_KEY = "grower_tools_ai_enabled";

export const GROWER_TOOLS_AI_TOOL_KEYS = {
  soilMixer: "grower_tools_ai_soil_mixer_enabled",
  fertilizer: "grower_tools_ai_fertilizer_enabled",
  plantDoctor: "grower_tools_ai_plant_doctor_enabled",
} as const;

export type GrowerToolAiFlags = {
  soilMixer: boolean;
  fertilizer: boolean;
  plantDoctor: boolean;
};

export const GROWER_TOOLS_AI_TOOL_OPTIONS: {
  action: GrowerToolAiAction;
  settingKey: string;
  labelTh: string;
  labelEn: string;
  descTh: string;
  descEn: string;
}[] = [
  {
    action: "soil-mixer",
    settingKey: GROWER_TOOLS_AI_TOOL_KEYS.soilMixer,
    labelTh: "ผสมดิน (Soil Mixer)",
    labelEn: "Soil Mixer",
    descTh: "คำนวณสูตร Super soil ทันที + ถามเพิ่ม (AI optional)",
    descEn: "Instant Super soil recipe + optional AI Q&A",
  },
  {
    action: "fertilizer",
    settingKey: GROWER_TOOLS_AI_TOOL_KEYS.fertilizer,
    labelTh: "แนะนำปุ๋ย (Fertilizer)",
    labelEn: "Fertilizer Advisor",
    descTh: "แนะนำแบรนด์ปุ๋ย + NPK ตามสื่อปลูก",
    descEn: "Brand-line feeding advice + NPK",
  },
  {
    action: "plant-doctor",
    settingKey: GROWER_TOOLS_AI_TOOL_KEYS.plantDoctor,
    labelTh: "วิเคราะห์อาการ (Plant Doctor)",
    labelEn: "Plant Doctor",
    descTh: "วิเคราะห์รูปด้วย gpt-4o vision — ใช้ token สูงสุด",
    descEn: "Photo triage via gpt-4o vision — highest token cost",
  },
];

const ACTION_TO_SETTING_KEY: Record<GrowerToolAiAction, string> = {
  "soil-mixer": GROWER_TOOLS_AI_TOOL_KEYS.soilMixer,
  fertilizer: GROWER_TOOLS_AI_TOOL_KEYS.fertilizer,
  "plant-doctor": GROWER_TOOLS_AI_TOOL_KEYS.plantDoctor,
};

/** Default true when key is missing (first deploy). */
export function parseGrowerToolsAiEnabled(value: string | undefined | null): boolean {
  return value !== "false";
}

export function resolveGrowerToolAiEnabled(
  settings: Record<string, string>,
  action: GrowerToolAiAction
): boolean {
  const toolKey = ACTION_TO_SETTING_KEY[action];
  if (toolKey in settings) {
    return parseGrowerToolsAiEnabled(settings[toolKey]);
  }
  if (GROWER_TOOLS_AI_SETTING_KEY in settings) {
    return parseGrowerToolsAiEnabled(settings[GROWER_TOOLS_AI_SETTING_KEY]);
  }
  return true;
}

export function resolveGrowerToolsAiFlags(settings: Record<string, string>): GrowerToolAiFlags {
  return {
    soilMixer: resolveGrowerToolAiEnabled(settings, "soil-mixer"),
    fertilizer: resolveGrowerToolAiEnabled(settings, "fertilizer"),
    plantDoctor: resolveGrowerToolAiEnabled(settings, "plant-doctor"),
  };
}

export function isGrowerToolAiAvailable(
  slug: string,
  flags: GrowerToolAiFlags
): boolean {
  switch (slug) {
    case "soil-mixer":
      return flags.soilMixer;
    case "fertilizer":
      return flags.fertilizer;
    case "plant-doctor":
      return flags.plantDoctor;
    default:
      return true;
  }
}
