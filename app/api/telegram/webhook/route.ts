import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { AIFilePart, ChatMessage } from "@/lib/ai-provider";
import { callAIWithTools, EMPTY_AI_REPLY_TH } from "@/lib/ai-tools";
import { env } from "@/lib/env";
import {
  FOUNDER_CHAT_ID,
  FOUNDER_SESSION_ID,
} from "@/lib/ssb-assistant-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SCHEMA = "ssb_assistant";
const HISTORY_LIMIT = 15;
const TELEGRAM_MAX_CHARS = 4000;
/** Telegram bots can download files up to 20MB; keep a safer cap for Gemini. */
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const DEFAULT_PERSONA =
  "You are the private AI secretary of Tommy Kawila, Founder of Smile Seed Bank. Be precise, professional, and helpful.";

const TOOLS_RULE =
  "DATA RULES: For catalog size / how many products in the shop, call get_catalog_stats. For product name, SKU, price, stock, inventory, sales revenue, profit, order counts, or low-stock questions you MUST call the provided tools (get_catalog_stats, search_products, get_product_detail, get_sales_summary, get_low_stock). Never invent or guess those numbers. If a tool fails or returns empty, say so clearly.";

const ERROR_REPLY_TH =
  "ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่";

const DENIED_REPLY_TH =
  "ขออภัยครับ แชทนี้ไม่ได้รับอนุญาตให้ใช้ SSB Assistant";

const DEFAULT_PDF_PROMPT =
  "Please read this PDF carefully and summarize the key points in Thai. Extract important facts, numbers, names, and action items.";

const DEFAULT_IMAGE_PROMPT =
  "Please describe this image and extract any useful text, numbers, or product details in Thai.";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type TelegramDocument = {
  file_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type TelegramPhotoSize = {
  file_id: string;
  file_unique_id?: string;
  width?: number;
  height?: number;
  file_size?: number;
};

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    chat?: { id?: number | string };
    text?: string;
    caption?: string;
    document?: TelegramDocument;
    photo?: TelegramPhotoSize[];
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

function isAllowedChat(chatId: string): boolean {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS?.trim();
  if (!raw) {
    // Unset = allow (dev/setup); set env in production for sales secrecy.
    return true;
  }
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(chatId);
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

  const body =
    text.length > TELEGRAM_MAX_CHARS
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

function isPdfDocument(doc: TelegramDocument): boolean {
  const mime = (doc.mime_type ?? "").toLowerCase();
  const name = (doc.file_name ?? "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
}

function isImageDocument(doc: TelegramDocument): boolean {
  const mime = (doc.mime_type ?? "").toLowerCase();
  if (IMAGE_MIME.has(mime)) return true;
  const name = (doc.file_name ?? "").toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

function mimeFromImagePath(filePath: string, fallback: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

async function downloadTelegramFile(
  fileId: string,
  maxBytes: number,
  mimeType: string
): Promise<AIFilePart> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const metaRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  const metaJson = (await metaRes.json()) as {
    ok?: boolean;
    result?: { file_path?: string; file_size?: number };
    description?: string;
  };
  if (!metaRes.ok || !metaJson.ok || !metaJson.result?.file_path) {
    throw new Error(
      `Telegram getFile failed: ${metaJson.description ?? metaRes.status}`
    );
  }

  const size = metaJson.result.file_size ?? 0;
  if (size > maxBytes) {
    throw new Error(`FILE_TOO_LARGE:${size}:${maxBytes}`);
  }

  const fileUrl = `https://api.telegram.org/file/bot${token}/${metaJson.result.file_path}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    throw new Error(`Telegram file download failed: ${fileRes.status}`);
  }

  const buf = Buffer.from(await fileRes.arrayBuffer());
  if (buf.byteLength > maxBytes) {
    throw new Error(`FILE_TOO_LARGE:${buf.byteLength}:${maxBytes}`);
  }

  const resolvedMime =
    mimeType.startsWith("image/")
      ? mimeFromImagePath(metaJson.result.file_path, mimeType)
      : mimeType;

  return {
    mimeType: resolvedMime,
    dataBase64: buf.toString("base64"),
  };
}

function pickLargestPhoto(
  photos: TelegramPhotoSize[]
): TelegramPhotoSize | null {
  if (!photos.length) return null;
  return photos.reduce((best, p) => {
    const bestArea = (best.width ?? 0) * (best.height ?? 0);
    const area = (p.width ?? 0) * (p.height ?? 0);
    return area >= bestArea ? p : best;
  });
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
  const chatIdRaw = message?.chat?.id;
  if (chatIdRaw === undefined || chatIdRaw === null) {
    return NextResponse.json({ ok: true });
  }

  // chatId = Telegram API target / allowlist. historySessionId = DB thread.
  // Founder (988973577) shares session "tommy" with Admin chat for continuity.
  const chatId = String(chatIdRaw);
  const historySessionId =
    chatId === FOUNDER_CHAT_ID ? FOUNDER_SESSION_ID : chatId;
  const text = message?.text?.trim() ?? "";
  const caption = message?.caption?.trim() ?? "";
  const document = message?.document;
  const photos = message?.photo;

  if (!text && !document && !photos?.length) {
    return NextResponse.json({ ok: true });
  }

  if (!isAllowedChat(chatId)) {
    console.warn("[telegram webhook] chat denied", { chatId });
    try {
      await sendTelegramMessage(chatId, DENIED_REPLY_TH);
    } catch (err) {
      console.error("[telegram webhook] deny reply failed:", err);
    }
    return NextResponse.json({ ok: true });
  }

  try {
    if (document && !isPdfDocument(document) && !isImageDocument(document)) {
      await sendTelegramMessage(
        chatId,
        "ตอนนี้รองรับเฉพาะ PDF และรูปภาพ (JPEG/PNG/WebP) ครับ"
      );
      return NextResponse.json({ ok: true });
    }

    let files: AIFilePart[] | undefined;
    let userContent = text;

    if (document && isPdfDocument(document)) {
      const fileName = document.file_name || "document.pdf";
      const pdf = await downloadTelegramFile(
        document.file_id,
        MAX_PDF_BYTES,
        "application/pdf"
      );
      pdf.fileName = fileName;
      files = [pdf];
      const prompt = caption || text || DEFAULT_PDF_PROMPT;
      userContent = `[PDF attached: ${fileName}]\n${prompt}`;
      console.log("[telegram webhook] pdf downloaded", {
        chatId,
        historySessionId,
        fileName,
        bytesApprox: Math.round((pdf.dataBase64.length * 3) / 4),
      });
    } else if (document && isImageDocument(document)) {
      const fileName = document.file_name || "image";
      const mime = (document.mime_type ?? "image/jpeg").toLowerCase();
      const resolved = IMAGE_MIME.has(mime) ? mime : "image/jpeg";
      const img = await downloadTelegramFile(
        document.file_id,
        MAX_IMAGE_BYTES,
        resolved
      );
      img.fileName = fileName;
      files = [img];
      const prompt = caption || text || DEFAULT_IMAGE_PROMPT;
      userContent = `[Image attached: ${fileName}]\n${prompt}`;
      console.log("[telegram webhook] image doc downloaded", {
        chatId,
        historySessionId,
        fileName,
        mime: img.mimeType,
      });
    } else if (photos?.length) {
      const best = pickLargestPhoto(photos);
      if (best) {
        const img = await downloadTelegramFile(
          best.file_id,
          MAX_IMAGE_BYTES,
          "image/jpeg"
        );
        img.fileName = "photo.jpg";
        files = [img];
        const prompt = caption || text || DEFAULT_IMAGE_PROMPT;
        userContent = `[Image attached: photo]\n${prompt}`;
        console.log("[telegram webhook] photo downloaded", {
          chatId,
          historySessionId,
          w: best.width,
          h: best.height,
        });
      }
    }

    if (!userContent.trim() && !files?.length) {
      return NextResponse.json({ ok: true });
    }

    const [persona, history] = await Promise.all([
      getSystemPersona(),
      getRecentHistory(historySessionId),
    ]);

    const messages: ChatMessage[] = [
      { role: "system", content: `${persona}\n\n${TOOLS_RULE}` },
      ...history,
      {
        role: "user",
        content:
          userContent ||
          (files?.[0]?.mimeType === "application/pdf"
            ? DEFAULT_PDF_PROMPT
            : DEFAULT_IMAGE_PROMPT),
      },
    ];

    const ai = await callAIWithTools(messages, { files, maxRounds: 3 });
    console.log("[telegram webhook] callAIWithTools ok", {
      model: ai.model,
      chatId,
      historySessionId,
      hadFiles: Boolean(files?.length),
    });

    await sendTelegramMessage(chatId, ai.content || EMPTY_AI_REPLY_TH);
    console.log("[telegram webhook] send ok", { chatId, historySessionId });

    try {
      // Always source=telegram; founder rows land on session "tommy" with Admin.
      await saveMessage(historySessionId, "user", userContent);
      await saveMessage(historySessionId, "assistant", ai.content, ai.model);
      console.log("[telegram webhook] save ok", { chatId, historySessionId });
    } catch (saveErr) {
      console.error("[telegram webhook] save failed:", saveErr);
    }
  } catch (err) {
    console.error("[telegram webhook] process error:", err);
    try {
      const msgText = err instanceof Error ? err.message : "";
      let msg = ERROR_REPLY_TH;
      if (msgText.startsWith("FILE_TOO_LARGE:")) {
        const parts = msgText.split(":");
        const max = Number(parts[2] ?? 0);
        msg =
          max <= MAX_IMAGE_BYTES
            ? "ไฟล์รูปใหญ่เกินไปครับ (สูงสุดประมาณ 10MB) กรุณาส่งไฟล์ที่เล็กกว่า"
            : "ไฟล์ PDF ใหญ่เกินไปครับ (สูงสุดประมาณ 15MB) กรุณาส่งไฟล์ที่เล็กกว่า";
      }
      await sendTelegramMessage(chatId, msg);
    } catch (sendErr) {
      console.error("[telegram webhook] error reply failed:", sendErr);
    }
  }

  return NextResponse.json({ ok: true });
}
