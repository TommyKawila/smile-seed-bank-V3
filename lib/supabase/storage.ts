import { createClient } from "./client";

const BUCKET = "product-images";

/**
 * Uploads up to 5 product image files to Supabase Storage.
 * Files are renamed with a timestamp + UUID to avoid collisions.
 * Returns the public URL for each uploaded file.
 *
 * Supabase Setup (run once in SQL Editor):
 *   INSERT INTO storage.buckets (id, name, public)
 *   VALUES ('product-images', 'product-images', true)
 *   ON CONFLICT (id) DO NOTHING;
 */
export async function uploadProductImages(files: File[]): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      throw new Error(`อัปโหลดล้มเหลว: ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);
    urls.push(data.publicUrl);
  }

  return urls;
}
