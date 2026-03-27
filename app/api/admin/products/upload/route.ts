import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "product-images";

function safeProductsPath(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.includes("..") || t.startsWith("/")) return null;
  if (!/^products\/[a-zA-Z0-9._-]+\.webp$/.test(t)) return null;
  return t;
}

/**
 * POST /api/admin/products/upload
 * form: file (required), objectPath (optional, under products/)
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const objectPathRaw = form.get("objectPath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const sizeBytes = buffer.length;

    let key = safeProductsPath(objectPathRaw);
    if (!key) {
      key = `products/upload-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;
    }

    const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
      cacheControl: "31536000",
      upsert: true,
      contentType: "image/webp",
    });

    if (error) {
      console.error("[products/upload] storage error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);

    return NextResponse.json({ url: data.publicUrl, sizeBytes });
  } catch (err) {
    console.error("[products/upload] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
