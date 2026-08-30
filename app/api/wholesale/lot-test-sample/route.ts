import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolveLotTestSampleFile } from "@/lib/lot-test-sample-config";
import { PARTNER_DOCS_ROOT } from "@/lib/partner-docs-path";
import { applyPdfWatermark } from "@/lib/pdf-watermark";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const fileName = resolveLotTestSampleFile(code);
  if (!fileName) {
    return NextResponse.json({ error: "Sample not available" }, { status: 404 });
  }

  const filePath = path.join(PARTNER_DOCS_ROOT, fileName);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PARTNER_DOCS_ROOT))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const raw = await readFile(resolved);
    const watermarked = await applyPdfWatermark(raw);
    const safeName = `lot-test-sample-${code.toUpperCase()}.pdf`;

    return new NextResponse(watermarked, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err) {
    console.error("[api/wholesale/lot-test-sample]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
