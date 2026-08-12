/**
 * Shared helpers for schema `ssb_assistant` (Telegram + Admin chat).
 */

import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { ChatMessage } from "@/lib/ai-provider";
import { env } from "@/lib/env";

export const SSB_ASSISTANT_SCHEMA = "ssb_assistant";

/**
 * Founder Telegram chat_id maps to FOUNDER_SESSION_ID so Telegram + Admin
 * share one continuous thread (same session_id, different source tags).
 */
export const FOUNDER_CHAT_ID = "988973577";
export const FOUNDER_SESSION_ID = "tommy";

/** Admin chat uses the founder shared session ("tommy"). */
export const ADMIN_CHAT_SESSION_ID = FOUNDER_SESSION_ID;
export const ADMIN_CHAT_SOURCE = "admin";

export const DEFAULT_ASSISTANT_PERSONA =
  "You are the private AI secretary of Tommy Kawila, Founder of Smile Seed Bank. Be precise, professional, and helpful.";

export type AssistantSource = "telegram" | "admin" | string;

export type AssistantHistoryRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  model_used?: string | null;
};

/** Untyped client — `ssb_assistant` is outside generated Database types. */
export function assistantDb() {
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  return createSupabaseJsClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: SSB_ASSISTANT_SCHEMA },
  });
}

export async function getSystemPersona(): Promise<string> {
  try {
    const { data, error } = await assistantDb()
      .from("user_profile")
      .select("value")
      .eq("key", "system_persona")
      .maybeSingle();
    if (error) {
      console.error("[ssb-assistant] getSystemPersona:", error.message);
      return DEFAULT_ASSISTANT_PERSONA;
    }
    const value = (data as { value?: string } | null)?.value?.trim();
    return value || DEFAULT_ASSISTANT_PERSONA;
  } catch (err) {
    console.error("[ssb-assistant] getSystemPersona:", err);
    return DEFAULT_ASSISTANT_PERSONA;
  }
}

export async function getRecentHistory(
  sessionId: string,
  limit = 20,
  source?: AssistantSource
): Promise<ChatMessage[]> {
  try {
    let q = assistantDb()
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (source) {
      q = q.eq("source", source);
    }

    const { data, error } = await q;
    if (error) {
      console.error("[ssb-assistant] getRecentHistory:", error.message);
      return [];
    }

    const rows = (
      (data ?? []) as { role: string; content: string }[]
    ).reverse();
    return rows
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        role: r.role as "user" | "assistant",
        content: r.content,
      }));
  } catch (err) {
    console.error("[ssb-assistant] getRecentHistory:", err);
    return [];
  }
}

export async function listHistoryForUi(
  sessionId: string,
  limit = 40,
  source?: AssistantSource
): Promise<AssistantHistoryRow[]> {
  try {
    let q = assistantDb()
      .from("chat_history")
      .select("id, role, content, created_at, model_used")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (source) {
      q = q.eq("source", source);
    }

    const { data, error } = await q;
    if (error) {
      console.error("[ssb-assistant] listHistoryForUi:", error.message);
      return [];
    }

    const rows = (
      (data ?? []) as {
        id: number | string;
        role: string;
        content: string;
        created_at: string;
        model_used?: string | null;
      }[]
    )
      .reverse()
      .filter((r) => r.role === "user" || r.role === "assistant");

    return rows.map((r) => ({
      id: String(r.id),
      role: r.role as "user" | "assistant",
      content: r.content,
      created_at: r.created_at,
      model_used: r.model_used ?? null,
    }));
  } catch (err) {
    console.error("[ssb-assistant] listHistoryForUi:", err);
    return [];
  }
}

export async function saveMessage(opts: {
  sessionId: string;
  source: AssistantSource;
  role: "user" | "assistant";
  content: string;
  model?: string;
}): Promise<void> {
  const row: Record<string, string> = {
    session_id: opts.sessionId,
    source: opts.source,
    role: opts.role,
    content: opts.content,
  };
  if (opts.role === "assistant" && opts.model) {
    row.model_used = opts.model;
  }

  const { error } = await assistantDb().from("chat_history").insert(row);
  if (error) {
    throw new Error(`saveMessage failed: ${error.message}`);
  }
}

export function sessionSummaryKey(sessionId: string): string {
  return `session_summary_${sessionId}`;
}

export async function getSessionSummary(sessionId: string): Promise<string | null> {
  try {
    const { data, error } = await assistantDb()
      .from("user_profile")
      .select("value")
      .eq("key", sessionSummaryKey(sessionId))
      .maybeSingle();
    if (error) {
      console.error("[ssb-assistant] getSessionSummary:", error.message);
      return null;
    }
    const value = (data as { value?: string } | null)?.value?.trim();
    return value || null;
  } catch (err) {
    console.error("[ssb-assistant] getSessionSummary:", err);
    return null;
  }
}

export async function upsertSessionSummary(
  sessionId: string,
  summary: string
): Promise<void> {
  const value = summary.trim();
  if (!value) return;
  const key = sessionSummaryKey(sessionId);
  const { data: existing } = await assistantDb()
    .from("user_profile")
    .select("key")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    const { error } = await assistantDb()
      .from("user_profile")
      .update({ value })
      .eq("key", key);
    if (error) throw new Error(`upsertSessionSummary update: ${error.message}`);
  } else {
    const { error } = await assistantDb()
      .from("user_profile")
      .insert({ key, value });
    if (error) throw new Error(`upsertSessionSummary insert: ${error.message}`);
  }
}

export async function countChatHistory(sessionId: string): Promise<number> {
  try {
    const { count, error } = await assistantDb()
      .from("chat_history")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if (error) {
      console.error("[ssb-assistant] countChatHistory:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("[ssb-assistant] countChatHistory:", err);
    return 0;
  }
}

export type AssistantDraftInput = {
  sessionId: string;
  source: AssistantSource;
  channelHint?: "line" | "email" | "generic";
  orderId?: string | null;
  bodyTh?: string | null;
  bodyEn?: string | null;
  rawAssistantContent: string;
};

export async function saveAssistantDraft(
  input: AssistantDraftInput
): Promise<void> {
  try {
    const { error } = await assistantDb().from("assistant_drafts").insert({
      session_id: input.sessionId,
      source: input.source,
      channel_hint: input.channelHint ?? "generic",
      order_id: input.orderId ?? null,
      body_th: input.bodyTh ?? null,
      body_en: input.bodyEn ?? null,
      raw_content: input.rawAssistantContent,
    });
    if (error) {
      console.error("[ssb-assistant] saveAssistantDraft:", error.message);
    }
  } catch (err) {
    console.error("[ssb-assistant] saveAssistantDraft:", err);
  }
}
