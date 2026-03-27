import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = new Set([
  "product-images",
  "brand-assets",
  "payment-slips",
]);

function sanitizePaths(paths: unknown): string[] | null {
  if (!Array.isArray(paths)) return null;
  if (paths.length === 0 || paths.length > 50) return null;
  const out: string[] = [];
  for (const p of paths) {
    if (typeof p !== "string") return null;
    const t = p.trim();
    if (!t || t.includes("..") || t.startsWith("/")) return null;
    out.push(t);
  }
  return out;
}

/**
 * POST /api/admin/storage/delete
 * Body: { bucketName: string, paths: string[] }
 * Uses service role (createAdminClient) — no browser → Supabase Storage CORS.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { bucketName?: unknown; paths?: unknown };
    const bucketName =
      typeof body.bucketName === "string" ? body.bucketName.trim() : "";
    const paths = sanitizePaths(body.paths);

    if (!bucketName || !paths) {
      return NextResponse.json(
        { error: "bucketName (string) and paths (non-empty string[]) required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_BUCKETS.has(bucketName)) {
      return NextResponse.json({ error: "bucket not allowed" }, { status: 403 });
    }

    console.log("[storage/delete]", {
      bucket: bucketName,
      count: paths.length,
      paths,
    });

    const supabase = await createAdminClient();
    const { error } = await supabase.storage.from(bucketName).remove(paths);

    if (error) {
      console.error("[storage/delete] supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, removed: paths });
  } catch (e) {
    console.error("[storage/delete] unexpected:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
