import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import {
  greenFuturePartnerDocPath,
  isAllowedGreenFuturePartnerDoc,
} from "@/lib/partner-doc-files";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ file: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const { file: raw } = await ctx.params;
  const fileName = path.basename(decodeURIComponent(raw ?? "").trim());
  if (!isAllowedGreenFuturePartnerDoc(fileName)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const abs = greenFuturePartnerDocPath(fileName);
  const root = path.join(process.cwd(), "private", "partner-docs", "green-future");
  if (!abs.startsWith(root + path.sep) || !existsSync(abs)) {
    return NextResponse.json({ error: "File missing on server" }, { status: 404 });
  }

  const { size } = statSync(abs);
  const stream = createReadStream(abs);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(size),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
