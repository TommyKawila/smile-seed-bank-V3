import { NextRequest, NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import { AiImportRowSchema } from "@/lib/validations/ai-importer";
import { runAiImportPipeline } from "@/services/ai-importer.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/import/ai
 * Body: one Google Sheet row — { name, breeder, url, price, stock, dryRun? }
 * Pipeline: resolve breeder → Firecrawl scrape → Claude JSON → Zod → create/update product.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AiImportRowSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid body", path: issue?.path },
        { status: 400 }
      );
    }

    const result = await runAiImportPipeline(parsed.data);
    if (result.error || !result.data) {
      return NextResponse.json({ error: result.error ?? "Import failed" }, { status: 422 });
    }

    const d = result.data;
    return NextResponse.json(
      bigintToJson({
        ok: true,
        mode: d.mode,
        productId: d.productId != null ? String(d.productId) : null,
        breederId: String(d.breederId),
        masterSku: d.masterSku,
        extracted: d.extracted,
        scrapeError: d.scrapeError,
      }),
      { status: d.mode === "dry_run" ? 200 : d.mode === "created" ? 201 : 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
