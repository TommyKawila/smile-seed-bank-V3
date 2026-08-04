import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import { callAI, type ChatMessage } from "@/lib/ai-provider";
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

const postSchema = z.object({
  message: z.string().trim().min(1).max(8000),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const raw = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    Math.max(Number(raw) || UI_HISTORY_LIMIT, 1),
    50
  );

  const messages = await listHistoryForUi(
    ADMIN_CHAT_SESSION_ID,
    limit,
    ADMIN_CHAT_SOURCE
  );

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
      { error: "message is required" },
      { status: 400 }
    );
  }

  const userMessage = parsed.data.message;

  try {
    const [persona, history] = await Promise.all([
      getSystemPersona(),
      getRecentHistory(
        ADMIN_CHAT_SESSION_ID,
        MODEL_HISTORY_LIMIT,
        ADMIN_CHAT_SOURCE
      ),
    ]);

    const messages: ChatMessage[] = [
      { role: "system", content: persona },
      ...history,
      { role: "user", content: userMessage },
    ];

    const ai = await callAI(messages, "gemini");
    const reply = ai.content?.trim() || "(empty response)";

    try {
      await saveMessage({
        sessionId: ADMIN_CHAT_SESSION_ID,
        source: ADMIN_CHAT_SOURCE,
        role: "user",
        content: userMessage,
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
