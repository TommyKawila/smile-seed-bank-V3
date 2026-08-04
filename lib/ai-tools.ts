/**
 * Gemini tool-calling loop for SSB Assistant (live DB tools).
 */

import {
  GoogleGenAI,
  Type,
  createPartFromFunctionResponse,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/genai";
import type { AIFilePart, AIResponse, ChatMessage } from "@/lib/ai-provider";
import { executeAssistantTool } from "@/services/assistant-tools-service";

const MAX_TOKENS = 4096;
const TEMPERATURE = 0.4;
const DEFAULT_MAX_ROUNDS = 3;

function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
}

function requireGeminiKey(): string {
  const key =
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing API key for model 'gemini'. Please set GOOGLE_API_KEY or GEMINI_API_KEY."
    );
  }
  return key;
}

let geminiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: requireGeminiKey() });
  }
  return geminiClient;
}

export const ASSISTANT_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search Smile Seed Bank catalog by product name, master SKU, or variant SKU. Returns price and stock.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search text (name or SKU)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product_detail",
    description:
      "Get full product detail and variants by productId (from search_products), or by slug / name query.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: {
          type: Type.NUMBER,
          description: "Numeric product id (optional if slug or query set)",
        },
        slug: {
          type: Type.STRING,
          description: "Product URL slug (optional)",
        },
        query: {
          type: Type.STRING,
          description: "Product name or SKU search text (optional)",
        },
      },
    },
  },
  {
    name: "get_sales_summary",
    description:
      "Get paid-order sales summary (revenue, COGS, profit, order count). Optional ISO date range YYYY-MM-DD.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: {
          type: Type.STRING,
          description: "Start date YYYY-MM-DD (optional)",
        },
        to: {
          type: Type.STRING,
          description: "End date YYYY-MM-DD (optional)",
        },
      },
    },
  },
  {
    name: "get_low_stock",
    description:
      "List variants at or below their low-stock threshold (near sold out).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_catalog_stats",
    description:
      "Get catalog size: active product count, active variant count, total stock units, and counts by product_kind (seed/merch). Use for questions like how many products are in the shop.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export const EMPTY_AI_REPLY_TH =
  "ขออภัยครับ ยังสรุปคำตอบไม่ได้ในรอบนี้ กรุณาลองถามใหม่อีกครั้ง";

function splitSystem(messages: ChatMessage[]): {
  system: string | undefined;
  rest: ChatMessage[];
} {
  const systemParts: string[] = [];
  const rest: ChatMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      if (m.content.trim()) systemParts.push(m.content);
    } else {
      rest.push(m);
    }
  }
  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    rest,
  };
}

function buildContents(messages: ChatMessage[], files?: AIFilePart[]): Content[] {
  const { rest } = splitSystem(messages);
  let lastUserIdx = -1;
  for (let i = rest.length - 1; i >= 0; i--) {
    if (rest[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  const contents: Content[] = rest.map((m, idx) => {
    const parts: Part[] = [{ text: m.content || " " }];
    if (files?.length && idx === lastUserIdx && m.role === "user") {
      for (const f of files) {
        parts.push({
          inlineData: { mimeType: f.mimeType, data: f.dataBase64 },
        });
      }
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  if (contents.length === 0) {
    const parts: Part[] = [{ text: " " }];
    if (files?.length) {
      for (const f of files) {
        parts.push({
          inlineData: { mimeType: f.mimeType, data: f.dataBase64 },
        });
      }
    }
    contents.push({ role: "user", parts });
  }

  return contents;
}

function toJsonSafe(value: unknown): Record<string, unknown> {
  try {
    const raw = JSON.stringify(value, (_k, v) => {
      if (typeof v === "bigint") return Number(v);
      if (v instanceof Date) return v.toISOString();
      return v;
    });
    const parsed = JSON.parse(raw ?? "null") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { output: parsed as unknown };
  } catch {
    return { error: "Failed to serialize tool result" };
  }
}

export type CallAIWithToolsOptions = {
  files?: AIFilePart[];
  maxRounds?: number;
  tools?: FunctionDeclaration[];
  /** Custom executor; defaults to executeAssistantTool */
  executeTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

type ToolResultRow = { name: string; result: unknown };

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function formatOneToolTh(name: string, result: unknown): string | null {
  const r = asRecord(result);
  if (!r) return null;
  if (typeof r.error === "string") return `ข้อผิดพลาด (${name}): ${r.error}`;

  if (name === "get_catalog_stats") {
    const byKind = asRecord(r.byKind);
    return [
      `สินค้า active ${String(r.activeProducts ?? "—")} รายการ`,
      `variant ${String(r.activeVariants ?? "—")}`,
      `สต็อกรวม ${String(r.totalVariantStockUnits ?? "—")} ชิ้น`,
      `(seed ${String(byKind?.seed ?? "—")} / merch ${String(byKind?.merch ?? "—")})`,
    ].join(" · ");
  }

  if (name === "search_products") {
    const products = Array.isArray(r.products) ? r.products : [];
    if (!products.length) return "ไม่พบสินค้าที่ตรงกับคำค้น";
    const lines = products.slice(0, 8).map((raw) => {
      const p = asRecord(raw);
      if (!p) return "—";
      return `• ${String(p.name)} (id ${String(p.id)}) · ราคา ${String(p.listPrice ?? "—")} · สต็อก ${String(p.aggregateStock ?? "—")}`;
    });
    return `ผลค้นหา ${products.length} รายการ:\n${lines.join("\n")}`;
  }

  if (name === "get_product_detail") {
    const variants = Array.isArray(r.variants) ? r.variants : [];
    const vLines = variants.slice(0, 6).map((raw) => {
      const v = asRecord(raw);
      if (!v) return "—";
      return `  - ${String(v.unitLabel)} · ฿${String(v.price)} · stock ${String(v.stock ?? 0)}`;
    });
    return [
      `${String(r.name)}${r.brand ? ` (${String(r.brand)})` : ""}`,
      `SKU: ${String(r.masterSku ?? "—")} · slug: ${String(r.slug ?? "—")}`,
      `ราคา ${String(r.listPrice ?? "—")}${r.salePrice != null ? ` · ลด ${String(r.salePrice)}` : ""} · สต็อก ${String(r.aggregateStock ?? "—")}`,
      vLines.length ? `Variants:\n${vLines.join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (name === "get_sales_summary") {
    return [
      `ยอดขาย ${String(r.totalRevenue ?? r.total_revenue ?? "—")}`,
      `ออเดอร์ ${String(r.totalOrders ?? r.total_orders ?? "—")}`,
      `กำไรสุทธิ ${String(r.netProfit ?? r.net_profit ?? "—")}`,
    ].join(" · ");
  }

  if (name === "get_low_stock") {
    const items = Array.isArray(r.items) ? r.items : [];
    if (!items.length) return "ไม่มีรายการใกล้หมดสต็อก";
    const lines = items.slice(0, 10).map((raw) => {
      const v = asRecord(raw);
      if (!v) return "—";
      return `• ${String(v.productName)} ${String(v.unitLabel)} · stock ${String(v.stock)}`;
    });
    return `ใกล้หมด ${String(r.count ?? items.length)} รายการ:\n${lines.join("\n")}`;
  }

  return null;
}

/** Deterministic Thai summary from tool payloads when Gemini returns empty text. */
export function formatToolResultsTh(rows: ToolResultRow[]): string | null {
  if (!rows.length) return null;
  const parts: string[] = [];
  for (const row of rows) {
    const line = formatOneToolTh(row.name, row.result);
    if (line) parts.push(line);
  }
  return parts.length ? parts.join("\n\n") : null;
}

async function resolveEmptyReply(
  contents: Content[],
  system: string | undefined,
  modelId: string,
  toolResults: ToolResultRow[],
  lastUsage?: { inputTokens?: number; outputTokens?: number }
): Promise<AIResponse> {
  const formatted = formatToolResultsTh(toolResults);
  if (formatted) {
    console.log("[ai-tools] using formatToolResultsTh fallback", {
      tools: toolResults.map((t) => t.name),
    });
    return { content: formatted, model: "gemini", usage: lastUsage };
  }

  const nudge: Content = {
    role: "user",
    parts: [
      {
        text: "สรุปคำตอบจากผล tool ด้านบนเป็นภาษาไทยให้ชัดเจน กระชับ ห้ามเว้นว่าง",
      },
    ],
  };
  const retry = await getClient().models.generateContent({
    model: modelId,
    contents: [...contents, nudge],
    config: {
      ...(system ? { systemInstruction: system } : {}),
      maxOutputTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    },
  });
  const text = retry.text?.trim() ?? "";
  if (text) {
    return {
      content: text,
      model: "gemini",
      usage: retry.usageMetadata
        ? {
            inputTokens: retry.usageMetadata.promptTokenCount,
            outputTokens: retry.usageMetadata.candidatesTokenCount,
          }
        : lastUsage,
    };
  }

  return { content: EMPTY_AI_REPLY_TH, model: "gemini", usage: lastUsage };
}

/**
 * Gemini generateContent loop with functionDeclarations.
 * Max rounds of tool calls then final text reply.
 */
export async function callAIWithTools(
  messages: ChatMessage[],
  options: CallAIWithToolsOptions = {}
): Promise<AIResponse> {
  const modelId = getGeminiModelId();
  const maxRounds = options.maxRounds ?? DEFAULT_MAX_ROUNDS;
  const declarations = options.tools ?? ASSISTANT_FUNCTION_DECLARATIONS;
  const execute = options.executeTool ?? executeAssistantTool;
  const { system } = splitSystem(messages);
  const contents = buildContents(messages, options.files);

  let lastUsage:
    | { inputTokens?: number; outputTokens?: number }
    | undefined;
  const toolResults: ToolResultRow[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const response = await getClient().models.generateContent({
      model: modelId,
      contents,
      config: {
        ...(system ? { systemInstruction: system } : {}),
        maxOutputTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        tools: [{ functionDeclarations: declarations }],
      },
    });

    const usageMeta = response.usageMetadata;
    if (usageMeta) {
      lastUsage = {
        inputTokens: usageMeta.promptTokenCount,
        outputTokens: usageMeta.candidatesTokenCount,
      };
    }

    const calls = response.functionCalls;
    if (!calls?.length) {
      const text = response.text?.trim() ?? "";
      if (text) {
        return { content: text, model: "gemini", usage: lastUsage };
      }
      return resolveEmptyReply(
        contents,
        system,
        modelId,
        toolResults,
        lastUsage
      );
    }

    const modelParts = response.candidates?.[0]?.content?.parts ?? [];
    contents.push({
      role: "model",
      parts: modelParts.length
        ? modelParts
        : calls.map((c) => ({
            functionCall: {
              id: c.id,
              name: c.name,
              args: c.args,
            },
          })),
    });

    const responseParts: Part[] = [];
    for (const call of calls) {
      const name = call.name?.trim() || "unknown";
      const args = (call.args ?? {}) as Record<string, unknown>;
      let result: unknown;
      try {
        result = await execute(name, args);
        const rec = asRecord(result);
        console.log("[ai-tools] tool ok", {
          name,
          error: typeof rec?.error === "string" ? rec.error : undefined,
        });
      } catch (err) {
        result = {
          error: err instanceof Error ? err.message : "Tool execution failed",
        };
        console.error("[ai-tools] tool failed", { name, err });
      }
      toolResults.push({ name, result });
      responseParts.push(
        createPartFromFunctionResponse(
          call.id ?? name,
          name,
          toJsonSafe(result)
        )
      );
    }
    contents.push({ role: "user", parts: responseParts });
  }

  // Final pass without forcing more tools if we hit max rounds with pending calls
  const final = await getClient().models.generateContent({
    model: modelId,
    contents,
    config: {
      ...(system ? { systemInstruction: system } : {}),
      maxOutputTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    },
  });

  const finalText = final.text?.trim() ?? "";
  if (finalText) {
    return {
      content: finalText,
      model: "gemini",
      usage: final.usageMetadata
        ? {
            inputTokens: final.usageMetadata.promptTokenCount,
            outputTokens: final.usageMetadata.candidatesTokenCount,
          }
        : lastUsage,
    };
  }

  return resolveEmptyReply(contents, system, modelId, toolResults, lastUsage);
}
