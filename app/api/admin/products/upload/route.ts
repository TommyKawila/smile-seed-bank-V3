import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  buildProductStoragePath,
  validateMagazineImageFile,
} from "@/lib/supabase-upload";
import { applyWatermark, storagePathAsWebp } from "@/lib/watermark";

const BUCKET = "product-images";

/** Legacy paths from inventory (optional). */
function safeLegacyProductsPath(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.includes("..") || t.startsWith("/")) return null;
  if (!/^products\/[a-zA-Z0-9._-]+$/.test(t)) return null;
  return t;
}

/**
 * POST /api/admin/products/upload
 * form: file (required), objectPath (optional legacy `products/...` under product-images)
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const objectPathRaw = form.get("objectPath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const err = validateMagazineImageFile(file);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const raw = Buffer.from(await file.arrayBuffer());
    const { buffer, watermarked } = await applyWatermark(raw);
    const sizeBytes = buffer.length;

    const legacy = safeLegacyProductsPath(objectPathRaw);
    const baseKey = legacy ?? buildProductStoragePath(file.name);
    const key = watermarked ? storagePathAsWebp(baseKey) : baseKey;
    const contentType = watermarked ? "image/webp" : file.type || "application/octet-stream";

    const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
      cacheControl: "31536000",
      upsert: true,
      contentType,
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
