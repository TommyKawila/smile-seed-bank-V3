import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractProductSpecs } from "@/services/ai-extractor";

const Schema = z.object({
  rawText: z.string().default(""),
  provider: z.enum(["gemini", "openai"]).default("gemini"),
  // Array of base64 data-URI strings, max 5 images
  images: z.array(z.string().startsWith("data:")).max(5).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { rawText, provider, images } = parsed.data;

    if (!rawText.trim() && images.length === 0) {
      return NextResponse.json(
        { error: "ต้องมีข้อความหรือรูปภาพอย่างน้อย 1 อย่าง" },
        { status: 400 }
      );
    }

    const { data, error } = await extractProductSpecs(rawText, provider, images);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
