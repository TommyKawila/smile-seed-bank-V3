import { NextRequest, NextResponse } from "next/server";
import type { AIFilePart } from "@/lib/ai-provider";
import { EMPTY_AI_REPLY_TH } from "@/lib/ai-tools";
import {
  FOUNDER_CHAT_ID,
  FOUNDER_SESSION_ID,
} from "@/lib/ssb-assistant-db";
import {
  handleTelegramCommand,
  parseCommand,
  UNKNOWN_COMMAND_REPLY_TH,
} from "@/lib/telegram-commands";
import { runAssistantTurn } from "@/services/assistant-orchestrator-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TELEGRAM_MAX_CHARS = 4000;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ERROR_REPLY_TH =
  "ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่";

const DENIED_REPLY_TH =
  "ขออภัยครับ ระบบนี้สำหรับผู้ได้รับอนุญาตเท่านั้น";

const ALLOWED_CHAT_IDS = ["988973577"];

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

  const resolvedMime = mimeType.startsWith("image/")
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

  if (!ALLOWED_CHAT_IDS.includes(chatId)) {
    console.warn("[telegram webhook] chat denied", { chatId });
    try {
      await sendTelegramMessage(chatId, DENIED_REPLY_TH);
    } catch (err) {
      console.error("[telegram webhook] deny reply failed:", err);
    }
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/") && !document && !photos?.length) {
    const cmd = parseCommand(text);
    const reply =
      handleTelegramCommand(cmd, { sessionId: historySessionId }) ??
      UNKNOWN_COMMAND_REPLY_TH;
    try {
      await sendTelegramMessage(chatId, reply);
    } catch (err) {
      console.error("[telegram webhook] command reply failed:", err);
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
      }
    }

    if (!userContent.trim() && !files?.length) {
      return NextResponse.json({ ok: true });
    }

    const result = await runAssistantTurn({
      sessionId: historySessionId,
      source: "telegram",
      userContent:
        userContent ||
        (files?.[0]?.mimeType === "application/pdf"
          ? DEFAULT_PDF_PROMPT
          : DEFAULT_IMAGE_PROMPT),
      model: "gemini",
      files,
    });

    const replyText = result.draft.hasDraft
      ? `${result.reply}\n\n(ร่างเท่านั้น — บอสส่งเอง)`
      : result.reply || EMPTY_AI_REPLY_TH;

    await sendTelegramMessage(chatId, replyText);
    console.log("[telegram webhook] orchestrator ok", {
      chatId,
      historySessionId,
      model: result.model,
      hadDraft: result.draft.hasDraft,
    });
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
