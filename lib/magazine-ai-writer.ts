import { z } from "zod";
import { htmlToTiptapDoc } from "@/lib/magazine-html-to-tiptap";

export type MagazineAiWriterParams = {
  raw_input: string;
  tone_mood?: string;
  opening_closing?: string;
  target_audience?: string;
};

const responseSchema = z.object({
  title: z.string(),
  tagline: z.string().optional().default(""),
  excerpt: z.string(),
  body_html: z.string(),
});

const MAGAZINE_AI_SYSTEM = `You are a professional Creative Writer for Smile Seed Bank, a cannabis seed retailer in Thailand. Do NOT just translate or summarize blindly. Use the provided Raw Data to write a compelling story. Follow the specified Tone, Opening/Closing logic, and Audience. Avoid AI clichés like "In the ever-evolving world of...", "It's important to note", "In today's fast-paced world", or generic blog filler. Make it sound authentic, witty, and deeply knowledgeable about cannabis genetics and cultivation.

You MUST respond with a single valid JSON object only (no markdown fences, no commentary). Use this exact shape:
{"title":"...","tagline":"...","excerpt":"...","body_html":"..."}

Rules for body_html:
- Valid HTML fragment only: use p, h2, h3, strong, em, ul, ol, li, blockquote, br as needed.
- No script, style, or iframe. No class attributes required.
- Structure the article with clear headings (h2/h3) and readable paragraphs.
- Aim for substantial editorial depth unless raw data is very short.`;

function stripJsonFence(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence?.[1]) s = fence[1].trim();
  return s;
}

function parseAiJson(raw: string): z.infer<typeof responseSchema> {
  const s = stripJsonFence(raw);
  const match = s.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in model response");
  const parsed = JSON.parse(match[0]) as unknown;
  return responseSchema.parse(parsed);
}

async function openAiChat(params: {
  system: string;
  user: string;
  model: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      temperature: 0.75,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI: ${err.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Empty model response");
  return text;
}

function buildContextBlock(p: MagazineAiWriterParams): string {
  const parts: string[] = [`## Raw Data / Research Notes\n${p.raw_input.trim()}`];
  if (p.tone_mood?.trim()) {
    parts.push(`## Tone & Mood\n${p.tone_mood.trim()}`);
  }
  if (p.opening_closing?.trim()) {
    parts.push(`## Opening / Closing logic\n${p.opening_closing.trim()}`);
  }
  if (p.target_audience?.trim()) {
    parts.push(`## Target audience\n${p.target_audience.trim()}`);
  }
  return parts.join("\n\n");
}

export async function generateMagazineDraftTh(
  p: MagazineAiWriterParams
): Promise<
  | { ok: true; title: string; tagline: string; excerpt: string; content: object }
  | { ok: false; error: string }
> {
  try {
    if (!p.raw_input?.trim()) {
      return { ok: false, error: "กรุณาวาง Raw Data / Research Notes ก่อน" };
    }
    const model =
      process.env.OPENAI_MAGAZINE_MODEL?.trim() || "gpt-4o-mini";
    const user = `${buildContextBlock(p)}

## Task
Write a complete magazine article in **Thai** for Smile Seed Blog. The JSON fields title, tagline, excerpt, and body_html must all be in Thai. Tagline can be an empty string if not needed.`;

    const raw = await openAiChat({
      system: MAGAZINE_AI_SYSTEM,
      user,
      model,
    });
    const out = parseAiJson(raw);
    const content = htmlToTiptapDoc(out.body_html) as unknown as object;
    return {
      ok: true,
      title: out.title.trim(),
      tagline: out.tagline.trim(),
      excerpt: out.excerpt.trim(),
      content,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function generateMagazineDraftEn(
  p: MagazineAiWriterParams
): Promise<
  | { ok: true; title: string; tagline: string; excerpt: string; content: object }
  | { ok: false; error: string }
> {
  try {
    if (!p.raw_input?.trim()) {
      return { ok: false, error: "Paste Raw Data / Research Notes first." };
    }
    const model =
      process.env.OPENAI_MAGAZINE_MODEL?.trim() || "gpt-4o-mini";
    const user = `${buildContextBlock(p)}

## Task
Write a polished, professional **English** blog post for an international audience. Do not merely translate — rewrite for clarity and engagement. All JSON fields (title, tagline, excerpt, body_html) must be in English. Tagline may be empty string if unnecessary.`;

    const raw = await openAiChat({
      system: MAGAZINE_AI_SYSTEM,
      user,
      model,
    });
    const out = parseAiJson(raw);
    const content = htmlToTiptapDoc(out.body_html) as unknown as object;
    return {
      ok: true,
      title: out.title.trim(),
      tagline: out.tagline.trim(),
      excerpt: out.excerpt.trim(),
      content,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
