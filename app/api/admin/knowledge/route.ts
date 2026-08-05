import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import {
  addKnowledgeFromText,
  listKnowledgeEntries,
} from "@/services/assistant-knowledge-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_BYTES = 1 * 1024 * 1024;

const jsonSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(200_000),
});

function isTxtOrMd(name: string, mime: string): boolean {
  const lower = name.toLowerCase();
  const m = mime.toLowerCase();
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return true;
  }
  return (
    m === "text/plain" ||
    m === "text/markdown" ||
    m === "text/x-markdown"
  );
}

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const entries = await listKnowledgeEntries();
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[api/admin/knowledge] GET:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list knowledge" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const titleRaw = form.get("title");
      const title =
        typeof titleRaw === "string" && titleRaw.trim()
          ? titleRaw.trim()
          : undefined;
      const file = form.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "file is required (.txt or .md)" },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "File too large (max 1MB)" },
          { status: 400 }
        );
      }
      if (!isTxtOrMd(file.name, file.type || "")) {
        return NextResponse.json(
          { error: "Only .txt and .md files are allowed" },
          { status: 400 }
        );
      }

      const content = await file.text();
      const result = await addKnowledgeFromText({
        title: title || file.name.replace(/\.(txt|md|markdown)$/i, ""),
        content,
        source: "upload",
        filename: file.name,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = jsonSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const result = await addKnowledgeFromText({
      title: parsed.data.title,
      content: parsed.data.content,
      source: "paste",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/admin/knowledge] POST:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to add knowledge",
      },
      { status: 500 }
    );
  }
}
