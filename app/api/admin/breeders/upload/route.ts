import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "brand-assets";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const supabase = await createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "webp";
    const path = `breeders/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { cacheControl: "31536000", upsert: false, contentType: file.type });

    if (error) {
      console.error("[breeders/upload]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
