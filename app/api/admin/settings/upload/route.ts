import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "brand-assets";

/**
 * POST /api/admin/settings/upload
 * Accepts: multipart/form-data with fields: file (File), key (string)
 * Uploads logo to brand-assets bucket using service_role (bypasses RLS).
 * Returns: { url: string }
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const key = form.get("key") as string | null;

    if (!file || !key) {
      return NextResponse.json({ error: "file and key are required" }, { status: 400 });
    }

    if (key === "logo_secondary_png_url" && file.type !== "image/png") {
      return NextResponse.json({ error: "Secondary logo must be PNG format" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${key}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        cacheControl: "31536000",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[settings/upload] storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[settings/upload] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
