import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  optimizeImage,
  isPresetName,
  type ImagePresetName,
} from "@/lib/services/image-service";

const DEFAULT_BUCKET = "brand-assets";
const ALLOWED_BUCKETS = ["brand-assets", "site-assets"] as const;

/**
 * POST /api/admin/settings/upload?preset=hero|product|logo
 * multipart/form-data: file (File), key (string), optional bucket (brand-assets | site-assets)
 * With preset: optimizes to WebP before upload; stored path ends in .webp
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const presetParam = searchParams.get("preset");
    const preset: ImagePresetName | null =
      presetParam && isPresetName(presetParam) ? presetParam : null;

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const key = form.get("key") as string | null;
    const bucketRaw = form.get("bucket") as string | null;
    const bucket =
      bucketRaw && ALLOWED_BUCKETS.includes(bucketRaw as (typeof ALLOWED_BUCKETS)[number])
        ? bucketRaw
        : DEFAULT_BUCKET;

    if (!file || !key) {
      return NextResponse.json({ error: "file and key are required" }, { status: 400 });
    }

    if (presetParam && !preset) {
      return NextResponse.json(
        { error: "preset must be hero, product, or logo" },
        { status: 400 }
      );
    }

    if (key === "logo_secondary_png_url" && preset) {
      return NextResponse.json(
        { error: "Secondary logo must stay PNG; do not use preset on this key" },
        { status: 400 }
      );
    }

    if (key === "logo_secondary_png_url" && file.type !== "image/png") {
      return NextResponse.json({ error: "Secondary logo must be PNG format" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    let buffer = Buffer.from(await file.arrayBuffer());
    let ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    let contentType = file.type || "application/octet-stream";

    const isVideo = ext === "mp4" || ext === "webm";
    if (isVideo) {
      contentType =
        ext === "webm"
          ? "video/webm"
          : file.type?.startsWith("video/")
            ? file.type
            : "video/mp4";
    } else if (preset) {
      buffer = await optimizeImage(buffer, preset);
      ext = "webp";
      contentType = "image/webp";
    }

    const path = `${key}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        cacheControl: "31536000",
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error("[settings/upload] storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[settings/upload] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
