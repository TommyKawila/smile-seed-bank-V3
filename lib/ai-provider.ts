/**
 * Dynamic AI Router — route chat completions to Gemini, OpenAI, or Claude.
 * Lazy-inits each SDK client; keys from env (Gemini accepts GOOGLE_API_KEY or GEMINI_API_KEY).
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import OpenAI from "openai";

export type AIModel = "gemini" | "gpt-4o" | "claude";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIResponse = {
  content: string;
  model: AIModel;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

const DEFAULT_MODEL: AIModel = "gemini";
const MAX_TOKENS = 4096;
const OPENAI_TEMPERATURE = 0.4;

const GEMINI_MODEL_ID = "gemini-2.0-flash";
const OPENAI_MODEL_ID = "gpt-4o";
const CLAUDE_MODEL_ID = "claude-3-5-sonnet-20241022";

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function getGeminiApiKey(): string | undefined {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  return key?.trim() || undefined;
}

function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

function getAnthropicApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
}

function requireGeminiKey(): string {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(
      "Missing API key for model 'gemini'. Please set GOOGLE_API_KEY or GEMINI_API_KEY."
    );
  }
  return key;
}

function requireOpenAiKey(): string {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error(
      "Missing API key for model 'gpt-4o'. Please set OPENAI_API_KEY."
    );
  }
  return key;
}

function requireAnthropicKey(): string {
  const key = getAnthropicApiKey();
  if (!key) {
    throw new Error(
      "Missing API key for model 'claude'. Please set ANTHROPIC_API_KEY."
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Lazy clients
// ---------------------------------------------------------------------------

let geminiClient: GoogleGenerativeAI | null = null;
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(requireGeminiKey());
  }
  return geminiClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: requireOpenAiKey() });
  }
  return openaiClient;
}

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: requireAnthropicKey() });
  }
  return anthropicClient;
}

// ---------------------------------------------------------------------------
// Message splitting
// ---------------------------------------------------------------------------

function splitSystemMessages(messages: ChatMessage[]): {
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
  const system = systemParts.length > 0 ? systemParts.join("\n\n") : undefined;
  return { system, rest };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

async function callGemini(messages: ChatMessage[]): Promise<AIResponse> {
  const { system, rest } = splitSystemMessages(messages);
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_MODEL_ID,
    ...(system ? { systemInstruction: system } : {}),
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      temperature: OPENAI_TEMPERATURE,
    },
  });

  const contents: Content[] = rest.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Gemini requires at least one user turn
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "" }] });
  }

  const result = await model.generateContent({ contents });
  const response = result.response;
  const content = response.text();
  const usageMeta = response.usageMetadata;

  return {
    content,
    model: "gemini",
    usage: usageMeta
      ? {
          inputTokens: usageMeta.promptTokenCount,
          outputTokens: usageMeta.candidatesTokenCount,
        }
      : undefined,
  };
}

async function callOpenAI(messages: ChatMessage[]): Promise<AIResponse> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL_ID,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: OPENAI_TEMPERATURE,
    max_tokens: MAX_TOKENS,
  });

  const choice = completion.choices[0]?.message?.content ?? "";
  return {
    content: choice,
    model: "gpt-4o",
    usage: completion.usage
      ? {
          inputTokens: completion.usage.prompt_tokens,
          outputTokens: completion.usage.completion_tokens,
        }
      : undefined,
  };
}

async function callClaude(messages: ChatMessage[]): Promise<AIResponse> {
  const { system, rest } = splitSystemMessages(messages);
  const client = getAnthropicClient();

  const anthropicMessages = rest.map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  // Claude requires at least one user message
  if (anthropicMessages.length === 0) {
    anthropicMessages.push({ role: "user", content: "" });
  }

  const response = await client.messages.create({
    model: CLAUDE_MODEL_ID,
    max_tokens: MAX_TOKENS,
    ...(system ? { system } : {}),
    messages: anthropicMessages,
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content: text,
    model: "claude",
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Default model for callAI when none is specified. */
export function getDefaultModel(): AIModel {
  return DEFAULT_MODEL;
}

/** Models that currently have an API key configured in the environment. */
export function getAvailableModels(): AIModel[] {
  const available: AIModel[] = [];
  if (getGeminiApiKey()) available.push("gemini");
  if (getOpenAiApiKey()) available.push("gpt-4o");
  if (getAnthropicApiKey()) available.push("claude");
  return available;
}

/**
 * Route a chat completion to Gemini, OpenAI (gpt-4o), or Claude.
 * @param messages - Conversation turns (system / user / assistant)
 * @param model - Provider key; defaults to gemini
 */
export async function callAI(
  messages: ChatMessage[],
  model: AIModel = DEFAULT_MODEL
): Promise<AIResponse> {
  switch (model) {
    case "gemini":
      return callGemini(messages);
    case "gpt-4o":
      return callOpenAI(messages);
    case "claude":
      return callClaude(messages);
    default: {
      const _exhaustive: never = model;
      throw new Error(`Unsupported AI model: ${String(_exhaustive)}`);
    }
  }
}
