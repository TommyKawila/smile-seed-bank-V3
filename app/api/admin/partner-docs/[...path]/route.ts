import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-utils";
import { PARTNER_DOCS_ROOT } from "@/lib/partner-docs-path";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
};

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segments = (await params).path;
  if (!segments?.length || segments.some((s) => s.includes(".."))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(PARTNER_DOCS_ROOT, ...segments);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PARTNER_DOCS_ROOT))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buf = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(resolved)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
