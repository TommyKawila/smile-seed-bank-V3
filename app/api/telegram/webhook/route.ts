import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { callAI, type ChatMessage } from "@/lib/ai-provider";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SCHEMA = "ssb_assistant";
const HISTORY_LIMIT = 15;
const TELEGRAM_MAX_CHARS = 4000;
const DEFAULT_PERSONA =
  "You are the private AI secretary of Tommy Kawila, Founder of Smile Seed Bank. Be precise, professional, and helpful.";

const ERROR_REPLY_TH =
  "ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    chat?: { id?: number | string };
    text?: string;
  };
};

type HistoryRow = {
  role: string;
  content: string;
};

/** Untyped client — `ssb_assistant` is outside generated Database types. */
function assistantDb() {
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  return createSupabaseJsClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: SCHEMA },
  });
}

async function getSystemPersona(): Promise<string> {
  try {
    const { data, error } = await assistantDb()
      .from("user_profile")
      .select("value")
      .eq("key", "system_persona")
      .maybeSingle();
    if (error) {
      console.error("[telegram webhook] getSystemPersona:", error.message);
      return DEFAULT_PERSONA;
    }
    const value = (data as { value?: string } | null)?.value?.trim();
    return value || DEFAULT_PERSONA;
  } catch (err) {
    console.error("[telegram webhook] getSystemPersona:", err);
    return DEFAULT_PERSONA;
  }
}

async function getRecentHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await assistantDb()
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error) {
      console.error("[telegram webhook] getRecentHistory:", error.message);
      return [];
    }

    const rows = ((data ?? []) as HistoryRow[]).reverse();
    return rows
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        role: r.role as "user" | "assistant",
        content: r.content,
      }));
  } catch (err) {
    console.error("[telegram webhook] getRecentHistory:", err);
    return [];
  }
}

async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  model?: string
): Promise<void> {
  const row: Record<string, string> = {
    session_id: sessionId,
    source: "telegram",
    role,
    content,
  };
  if (role === "assistant" && model) {
    row.model_used = model;
  }

  const { error } = await assistantDb().from("chat_history").insert(row);
  if (error) {
    throw new Error(`saveMessage failed: ${error.message}`);
  }
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  const body = text.length > TELEGRAM_MAX_CHARS
    ? `${text.slice(0, TELEGRAM_MAX_CHARS - 1)}…`
    : text;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: body,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage ${res.status}: ${errBody}`);
  }
}

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  return header === secret;
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  const text = message?.text?.trim();
  const chatIdRaw = message?.chat?.id;
  if (!text || chatIdRaw === undefined || chatIdRaw === null) {
    return NextResponse.json({ ok: true });
  }

  const sessionId = String(chatIdRaw);

  try {
    const [persona, history] = await Promise.all([
      getSystemPersona(),
      getRecentHistory(sessionId),
    ]);

    const messages: ChatMessage[] = [
      { role: "system", content: persona },
      ...history,
      { role: "user", content: text },
    ];

    const ai = await callAI(messages);

    await saveMessage(sessionId, "user", text);
    await saveMessage(sessionId, "assistant", ai.content, ai.model);

    await sendTelegramMessage(sessionId, ai.content || "(empty response)");
  } catch (err) {
    console.error("[telegram webhook] process error:", err);
    try {
      await sendTelegramMessage(sessionId, ERROR_REPLY_TH);
    } catch (sendErr) {
      console.error("[telegram webhook] error reply failed:", sendErr);
    }
  }

  return NextResponse.json({ ok: true });
}
