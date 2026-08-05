import {
  getAvailableModels,
  getDefaultModel,
  getGeminiModelId,
  type AIModel,
} from "@/lib/ai-provider";

export type TelegramCommandContext = {
  sessionId: string;
};

function modelDisplayName(model: AIModel): string {
  switch (model) {
    case "gemini":
      return `Google Gemini (${getGeminiModelId()})`;
    case "gpt-4o":
      return "OpenAI GPT-4o";
    case "claude":
      return "Anthropic Claude";
    default: {
      const _exhaustive: never = model;
      return String(_exhaustive);
    }
  }
}

/** First slash token, lowercased; strips @BotName. Null if not a command. */
export function parseCommand(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;
  const token = trimmed.split(/\s+/)[0] ?? "";
  const base = token.split("@")[0]?.toLowerCase() ?? "";
  return base.length > 1 ? base : null;
}

function cmdStart(): string {
  return [
    "สวัสดีครับ ผม SSB Assistant — AI secretary ของ Tommy",
    "",
    "คำสั่งที่ใช้ได้:",
    "/start — ข้อความต้อนรับ",
    "/status — สถานะระบบ",
    "/model — โมเดลที่ใช้งาน",
    "/help — รายการคำสั่ง",
  ].join("\n");
}

function cmdHelp(): string {
  return [
    "คำสั่ง SSB Assistant:",
    "/start — ข้อความต้อนรับ",
    "/status — สถานะระบบ",
    "/model — โมเดลที่ใช้งาน",
    "/help — ช่วยเหลือ",
  ].join("\n");
}

function cmdStatus(ctx: TelegramCommandContext): string {
  const current = modelDisplayName(getDefaultModel());
  return [
    "สถานะ SSB Assistant",
    `Model: ${current}`,
    `session_id: ${ctx.sessionId}`,
    "Priority: Malikha deal",
  ].join("\n");
}

function cmdModel(): string {
  const def = getDefaultModel();
  const available = getAvailableModels();
  const list =
    available.length > 0
      ? available.map((m) => `• ${modelDisplayName(m)}`).join("\n")
      : "• (ยังไม่พบ API key ที่ตั้งค่าไว้)";

  return [
    `Default model: ${modelDisplayName(def)}`,
    "",
    "Available models:",
    list,
    "",
    "สลับโมเดลได้จาก Admin SSB Assistant — บน Telegram จะรองรับภายหลัง",
  ].join("\n");
}

/**
 * Returns a Thai reply for known commands, or null if unknown.
 * Does not call AI.
 */
export function handleTelegramCommand(
  cmd: string | null,
  ctx: TelegramCommandContext
): string | null {
  if (!cmd) return null;
  switch (cmd) {
    case "/start":
      return cmdStart();
    case "/help":
      return cmdHelp();
    case "/status":
      return cmdStatus(ctx);
    case "/model":
      return cmdModel();
    default:
      return null;
  }
}

export const UNKNOWN_COMMAND_REPLY_TH =
  "คำสั่งไม่รู้จักครับ ลอง /help เพื่อดูรายการคำสั่ง";
