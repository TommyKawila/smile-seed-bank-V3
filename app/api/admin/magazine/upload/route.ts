import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  MAGAZINE_BUCKET,
  buildMagazineStoragePath,
  validateMagazineImageFile,
} from "@/lib/supabase-upload";

/**
 * POST /api/admin/magazine/upload
 * multipart/form-data: file (required)
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const err = validateMagazineImageFile(file);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = createServiceRoleClient();
    const path = buildMagazineStoragePath(file.name);

    const { error } = await supabase.storage.from(MAGAZINE_BUCKET).upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    if (error) {
      console.error("[magazine/upload]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(MAGAZINE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("[magazine/upload]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
