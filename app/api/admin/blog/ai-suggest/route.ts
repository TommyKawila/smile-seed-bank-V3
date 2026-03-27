import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  topic: z.string().min(1, "กรุณาระบุหัวข้อ"),
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
    const { topic } = parsed.data;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY ไม่ได้ตั้งค่า" },
        { status: 500 }
      );
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a blog outline writer for Smile Seed Bank, a cannabis seed retailer in Thailand. Generate structured blog outlines in Thai. Return valid JSON only.",
          },
          {
            role: "user",
            content: `สร้างโครงร่างบทความ (outline) สำหรับหัวข้อ: "${topic}"\n\nคืนค่าเป็น JSON ในรูปแบบ:\n{\n  "title": "ชื่อบทความ",\n  "excerpt": "สรุปสั้นๆ 1-2 ประโยค",\n  "sections": [\n    { "heading": "หัวข้อ H2", "points": ["จุดที่ 1", "จุดที่ 2"] },\n    ...\n  ]\n}`,
          },
        ],
        temperature: 0.7,
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
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const outline = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: topic, excerpt: "", sections: [] };
    return NextResponse.json(outline);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
