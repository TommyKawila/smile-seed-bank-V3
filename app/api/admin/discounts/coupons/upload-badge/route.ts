import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const COUPONS_BUCKET = "coupons";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_LOTTIE_BYTES = 1 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/**
 * POST /api/admin/discounts/coupons/upload-badge
 * multipart/form-data: file (required), assetType: "image" | "lottie" (default image)
 * Uploads to Supabase Storage bucket `coupons` (public).
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const assetType = String(form.get("assetType") ?? "image").toLowerCase();

    if (!file?.size) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    if (assetType === "lottie") {
      if (file.size > MAX_LOTTIE_BYTES) {
        return NextResponse.json({ error: "Lottie JSON must be 1MB or smaller" }, { status: 400 });
      }
      const type = file.type || "application/octet-stream";
      const name = file.name.toLowerCase();
      const looksJson =
        name.endsWith(".json") ||
        type === "application/json" ||
        type === "text/json" ||
        type === "text/plain" ||
        type === "";
      if (!looksJson) {
        return NextResponse.json({ error: "Upload a valid .json Lottie file" }, { status: 400 });
      }
      const raw = Buffer.from(await file.arrayBuffer());
      const text = raw.toString("utf8").trim();
      if (!text.startsWith("{") && !text.startsWith("[")) {
        return NextResponse.json({ error: "File must be valid JSON" }, { status: 400 });
      }
      try {
        JSON.parse(text);
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }

      const path = `lottie/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.json`;
      const { error: uploadError } = await supabase.storage.from(COUPONS_BUCKET).upload(path, raw, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "application/json",
      });

      if (uploadError) {
        console.error("[coupons/upload-badge] lottie", uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data } = supabase.storage.from(COUPONS_BUCKET).getPublicUrl(path);
      return NextResponse.json({ url: data.publicUrl });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be 2MB or smaller" }, { status: 400 });
    }
    const type = file.type || "application/octet-stream";
    if (!IMAGE_TYPES.has(type)) {
      return NextResponse.json(
        { error: "Use PNG, JPG, WebP, GIF, or SVG" },
        { status: 400 }
      );
    }

    const ext =
      type === "image/svg+xml"
        ? "svg"
        : type === "image/webp"
          ? "webp"
          : type === "image/png"
            ? "png"
            : type === "image/gif"
              ? "gif"
              : "jpg";

    const path = `badges/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(COUPONS_BUCKET).upload(path, buffer, {
      cacheControl: "31536000",
      upsert: false,
      contentType: type,
    });

    if (uploadError) {
      console.error("[coupons/upload-badge]", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(COUPONS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("[coupons/upload-badge]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
