import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "product-images";

/**
 * POST /api/admin/products/upload
 * Accepts: multipart/form-data with field "file" (already compressed/watermarked Blob)
 * Uploads using service_role to bypass Storage RLS.
 * Returns: { url: string }
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, buffer, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp",
      });

    if (error) {
      console.error("[products/upload] storage error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[products/upload] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
