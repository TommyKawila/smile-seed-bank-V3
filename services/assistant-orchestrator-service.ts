/**
 * Shared Admin + Telegram assistant turn orchestration.
 * Persona + history + RAG + tools + draft-only customer reply rules.
 */

import {
  callAI,
  getGeminiModelId,
  type AIFilePart,
  type AIResponse,
  type ChatMessage,
} from "@/lib/ai-provider";
import { callAIWithTools, EMPTY_AI_REPLY_TH } from "@/lib/ai-tools";
import {
  countChatHistory,
  getRecentHistory,
  getSessionSummary,
  getSystemPersona,
  saveAssistantDraft,
  saveMessage,
  upsertSessionSummary,
  type AssistantSource,
} from "@/lib/ssb-assistant-db";
import { searchKnowledge } from "@/services/assistant-knowledge-service";
import { extractDraftBlocks } from "@/lib/assistant-draft";

export const MODEL_HISTORY_LIMIT = 28;
export const SUMMARY_REFRESH_EVERY = 20;

const TOOLS_RULE = [
  "DATA RULES: For live shop data you MUST call tools — never invent numbers.",
  "Catalog: get_catalog_stats, search_products, get_product_detail, get_low_stock.",
  "Sales: get_sales_summary.",
  "Orders/customers: lookup_order, search_customers, get_customer_orders, list_recent_orders, get_order_message_log.",
  "Supplier cost (Green Future): get_partner_cost_terms — INTERNAL ONLY; never paste raw EUR/THB cost to customers.",
  "You are READ-ONLY: never claim you shipped, cancelled, refunded, or messaged a customer yourself.",
].join(" ");

const DRAFT_RULE = [
  "DRAFT-ONLY CUSTOMER REPLIES: When Tommy asks you to reply to a customer (LINE/email/chat), draft the message — do NOT send it.",
  "Always remind that Tommy must copy and send himself.",
  "Format drafts exactly like this (include both languages when useful):",
  "---DRAFT_TH---",
  "(Thai reply body)",
  "---DRAFT_EN---",
  "(English reply body)",
  "---END_DRAFT---",
  "After the draft block, add a short reason + checklist of facts to verify.",
].join("\n");

function runtimeModelLabel(model: "gemini" | "gpt-4o"): string {
  return model === "gpt-4o"
    ? "OpenAI GPT-4o"
    : `Google Gemini (${getGeminiModelId()})`;
}

function runtimeModelRule(modelLabel: string): string {
  return [
    `RUNTIME_MODEL: ${modelLabel}`,
    "If asked which model/provider you are using, answer ONLY with RUNTIME_MODEL above.",
    "Do not invent versions. Ignore prior messages that disagree with RUNTIME_MODEL.",
  ].join(" ");
}

function formatKnowledgeBlock(
  hits: Awaited<ReturnType<typeof searchKnowledge>>
): string | null {
  if (!hits.length) return null;
  const parts = hits.map(
    (h, i) =>
      `[${i + 1}] ${h.title} (score ${h.score.toFixed(2)})\n${h.content.slice(0, 900)}`
  );
  return `KNOWLEDGE CONTEXT (use when relevant; prefer tools for live order/stock numbers):\n${parts.join("\n\n")}`;
}

export type RunAssistantTurnInput = {
  sessionId: string;
  source: AssistantSource;
  userContent: string;
  model?: "gemini" | "gpt-4o";
  files?: AIFilePart[];
  historyLimit?: number;
  maxToolRounds?: number;
  /** Persist chat_history rows (default true). */
  save?: boolean;
};

export type RunAssistantTurnResult = {
  reply: string;
  model: string;
  modelLabel: string;
  draft: ReturnType<typeof extractDraftBlocks>;
};

async function maybeRefreshSessionSummary(
  sessionId: string,
  history: ChatMessage[],
  latestUser: string,
  latestAssistant: string
): Promise<void> {
  try {
    const total = await countChatHistory(sessionId);
    if (total === 0 || total % SUMMARY_REFRESH_EVERY !== 0) return;

    const prior = (await getSessionSummary(sessionId)) ?? "";
    const digest = history
      .slice(-8)
      .map((m) => `${m.role}: ${m.content.slice(0, 240)}`)
      .join("\n");

    const summaryAi = await callAI(
      [
        {
          role: "system",
          content:
            "Summarize the ongoing founder ↔ secretary chat for future context. Max 12 bullet lines. Keep order numbers, customer names/phones, open tasks, decisions. Thai or English OK. No fluff.",
        },
        {
          role: "user",
          content: [
            prior ? `Previous summary:\n${prior}` : "Previous summary: (none)",
            `Recent turns:\n${digest}`,
            `Latest user:\n${latestUser.slice(0, 500)}`,
            `Latest assistant:\n${latestAssistant.slice(0, 500)}`,
          ].join("\n\n"),
        },
      ],
      "gemini"
    );

    const next = summaryAi.content?.trim();
    if (next) await upsertSessionSummary(sessionId, next);
  } catch (err) {
    console.error("[assistant-orchestrator] summary refresh failed:", err);
  }
}

export async function runAssistantTurn(
  input: RunAssistantTurnInput
): Promise<RunAssistantTurnResult> {
  let model: "gemini" | "gpt-4o" = input.model ?? "gemini";
  const files = input.files ?? [];
  if (files.length > 0 && model !== "gemini") {
    model = "gemini";
  }

  const historyLimit = input.historyLimit ?? MODEL_HISTORY_LIMIT;
  const [persona, history, sessionSummary, knowledgeHits] = await Promise.all([
    getSystemPersona(),
    getRecentHistory(input.sessionId, historyLimit),
    getSessionSummary(input.sessionId),
    searchKnowledge(input.userContent, 5).catch(() => []),
  ]);

  const modelLabel = runtimeModelLabel(model);
  const knowledgeBlock = formatKnowledgeBlock(knowledgeHits);
  const summaryBlock = sessionSummary
    ? `SESSION MEMORY SUMMARY:\n${sessionSummary}`
    : null;

  const systemParts = [
    persona,
    TOOLS_RULE,
    DRAFT_RULE,
    runtimeModelRule(modelLabel),
    summaryBlock,
    knowledgeBlock,
  ].filter(Boolean);

  const messages: ChatMessage[] = [
    { role: "system", content: systemParts.join("\n\n") },
    ...history,
    { role: "user", content: input.userContent },
  ];

  const ai: AIResponse =
    model === "gpt-4o"
      ? await callAI(messages, "gpt-4o")
      : await callAIWithTools(messages, {
          files: files.length ? files : undefined,
          maxRounds: input.maxToolRounds ?? 4,
        });

  const reply = ai.content?.trim() || EMPTY_AI_REPLY_TH || "(empty response)";
  const draft = extractDraftBlocks(reply);

  if (input.save !== false) {
    try {
      await saveMessage({
        sessionId: input.sessionId,
        source: input.source,
        role: "user",
        content: input.userContent,
      });
      await saveMessage({
        sessionId: input.sessionId,
        source: input.source,
        role: "assistant",
        content: reply,
        model: ai.model,
      });
    } catch (saveErr) {
      console.error("[assistant-orchestrator] save failed:", saveErr);
    }

    if (draft.hasDraft) {
      void saveAssistantDraft({
        sessionId: input.sessionId,
        source: input.source,
        channelHint: "generic",
        bodyTh: draft.th,
        bodyEn: draft.en,
        rawAssistantContent: reply,
      });
    }

    void maybeRefreshSessionSummary(
      input.sessionId,
      history,
      input.userContent,
      reply
    );
  }

  return {
    reply,
    model: ai.model,
    modelLabel,
    draft,
  };
}
