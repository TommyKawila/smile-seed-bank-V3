import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  title: z.string().min(1, "กรุณาระบุหัวข้อ"),
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
    const { title } = parsed.data;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY ไม่ได้ตั้งค่า" },
        { status: 500 }
      );
    }
    const prompt = `Professional blog featured image for article: "${title}". Style: clean, modern, botanical/nature theme, suitable for cannabis seed bank blog. High quality, no text overlay.`;
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${err}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (!url) return NextResponse.json({ error: "ไม่ได้รับรูปภาพ" }, { status: 502 });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
