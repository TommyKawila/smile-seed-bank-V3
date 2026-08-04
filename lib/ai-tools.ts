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
      "Get full product detail and variants by numeric product id (from search_products).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: {
          type: Type.NUMBER,
          description: "Product id from search_products",
        },
      },
      required: ["productId"],
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
];

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
      return {
        content: response.text ?? "",
        model: "gemini",
        usage: lastUsage,
      };
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
      } catch (err) {
        result = {
          error: err instanceof Error ? err.message : "Tool execution failed",
        };
      }
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

  return {
    content: final.text ?? "",
    model: "gemini",
    usage: final.usageMetadata
      ? {
          inputTokens: final.usageMetadata.promptTokenCount,
          outputTokens: final.usageMetadata.candidatesTokenCount,
        }
      : lastUsage,
  };
}
