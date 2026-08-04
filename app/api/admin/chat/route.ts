import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import {
  callAI,
  getGeminiModelId,
  type AIFilePart,
  type ChatMessage,
} from "@/lib/ai-provider";
import { callAIWithTools, EMPTY_AI_REPLY_TH } from "@/lib/ai-tools";
import {
  ADMIN_CHAT_SESSION_ID,
  ADMIN_CHAT_SOURCE,
  getRecentHistory,
  getSystemPersona,
  listHistoryForUi,
  saveMessage,
} from "@/lib/ssb-assistant-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UI_HISTORY_LIMIT = 40;
const MODEL_HISTORY_LIMIT = 20;
const MAX_FILES = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const TOOLS_RULE =
  "DATA RULES: For catalog size / how many products in the shop, call get_catalog_stats. For product name, SKU, price, stock, inventory, sales revenue, profit, order counts, or low-stock questions you MUST call the provided tools (get_catalog_stats, search_products, get_product_detail, get_sales_summary, get_low_stock). Never invent or guess those numbers. If a tool fails or returns empty, say so clearly.";

function runtimeModelLabel(model: "gemini" | "gpt-4o"): string {
  return model === "gpt-4o"
    ? "OpenAI GPT-4o"
    : `Google Gemini (${getGeminiModelId()})`;
}

function runtimeModelRule(modelLabel: string): string {
  return [
    `RUNTIME_MODEL: ${modelLabel}`,
    "If asked which model/provider you are using, answer ONLY with RUNTIME_MODEL above.",
    "Do not invent versions (e.g. Gemini 1.5 Pro). Do not claim switching is impossible or requires backend changes — the admin UI already selects the provider for this request.",
    "Ignore any prior chat messages that disagree with RUNTIME_MODEL.",
  ].join(" ");
}

const DEFAULT_PDF_PROMPT =
  "Please read this PDF carefully and summarize the key points in Thai. Extract important facts, numbers, names, and action items.";

const DEFAULT_IMAGE_PROMPT =
  "Please describe this image and extract any useful text, numbers, or product details in Thai.";

const fileSchema = z.object({
  mimeType: z.string().trim().min(1).max(100),
  dataBase64: z.string().min(1),
  fileName: z.string().trim().max(200).optional(),
});

const postSchema = z
  .object({
    message: z.string().max(8000).optional().default(""),
    model: z.enum(["gemini", "gpt-4o"]).default("gemini"),
    files: z.array(fileSchema).max(MAX_FILES).optional().default([]),
  })
  .refine(
    (d) => d.message.trim().length > 0 || d.files.length > 0,
    { message: "message or files required" }
  );

/**
 * Admin chat always uses session "tommy" (ADMIN_CHAT_SESSION_ID).
 * History is loaded by session only (no source filter) so Telegram Founder
 * messages and Admin messages stay one continuous conversation.
 * Saves still tag source = "admin".
 * Optional image/PDF attachments → Gemini multimodal via callAIWithTools.
 */

function approxDecodedBytes(b64: string): number {
  const cleaned = b64.replace(/\s/g, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  return Math.floor((cleaned.length * 3) / 4) - padding;
}

function buildUserContent(
  message: string,
  files: { mimeType: string; fileName?: string }[]
): string {
  const text = message.trim();
  if (!files.length) return text;

  const labels = files.map((f) => {
    const name = f.fileName?.trim() || "attachment";
    const isPdf = f.mimeType === "application/pdf";
    return isPdf ? `[PDF attached: ${name}]` : `[Image attached: ${name}]`;
  });

  if (text) return `${labels.join("\n")}\n${text}`;

  const firstPdf = files.some((f) => f.mimeType === "application/pdf");
  return `${labels.join("\n")}\n${firstPdf ? DEFAULT_PDF_PROMPT : DEFAULT_IMAGE_PROMPT}`;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const raw = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    Math.max(Number(raw) || UI_HISTORY_LIMIT, 1),
    50
  );

  const messages = await listHistoryForUi(ADMIN_CHAT_SESSION_ID, limit);

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  const { message, model, files: rawFiles } = parsed.data;

  if (model === "gpt-4o" && rawFiles.length > 0) {
    return NextResponse.json(
      { error: "File attachments require model 'gemini'" },
      { status: 400 }
    );
  }

  const aiFiles: AIFilePart[] = [];
  for (const f of rawFiles) {
    const mime = f.mimeType.toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${f.mimeType}` },
        { status: 400 }
      );
    }
    const bytes = approxDecodedBytes(f.dataBase64);
    const max = mime === "application/pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (bytes > max) {
      return NextResponse.json(
        {
          error:
            mime === "application/pdf"
              ? "PDF too large (max ~15MB)"
              : "Image too large (max ~10MB)",
        },
        { status: 400 }
      );
    }
    aiFiles.push({
      mimeType: mime,
      dataBase64: f.dataBase64.replace(/\s/g, ""),
      fileName: f.fileName?.trim() || undefined,
    });
  }

  const userContent = buildUserContent(message, rawFiles);

  try {
    const [persona, history] = await Promise.all([
      getSystemPersona(),
      getRecentHistory(ADMIN_CHAT_SESSION_ID, MODEL_HISTORY_LIMIT),
    ]);

    const modelLabel = runtimeModelLabel(model);
    const systemBase =
      model === "gemini"
        ? `${persona}\n\n${TOOLS_RULE}\n\n${runtimeModelRule(modelLabel)}`
        : `${persona}\n\n${runtimeModelRule(modelLabel)}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemBase },
      ...history,
      { role: "user", content: userContent },
    ];

    const ai =
      model === "gpt-4o"
        ? await callAI(messages, "gpt-4o")
        : await callAIWithTools(messages, {
            files: aiFiles.length ? aiFiles : undefined,
            maxRounds: 3,
          });
    const reply =
      ai.content?.trim() || EMPTY_AI_REPLY_TH || "(empty response)";

    try {
      await saveMessage({
        sessionId: ADMIN_CHAT_SESSION_ID,
        source: ADMIN_CHAT_SOURCE,
        role: "user",
        content: userContent,
      });
      await saveMessage({
        sessionId: ADMIN_CHAT_SESSION_ID,
        source: ADMIN_CHAT_SOURCE,
        role: "assistant",
        content: reply,
        model: ai.model,
      });
    } catch (saveErr) {
      console.error("[api/admin/chat] save failed:", saveErr);
    }

    return NextResponse.json({
      reply,
      model: ai.model,
      modelLabel,
    });
  } catch (err) {
    console.error("[api/admin/chat] POST:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Chat request failed",
      },
      { status: 500 }
    );
  }
}
