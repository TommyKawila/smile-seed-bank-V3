import "server-only";

import { randomUUID } from "crypto";
import {
  GF_CLAIM_MAX_FILE_BYTES,
  type GfClaimUploadCategory,
  type GfClaimUploadedFile,
} from "@/lib/gf-seed-claim-form";
import {
  isDriveClaimUploadConfigured,
  uploadClaimFileToDrive,
} from "@/services/gf-seed-claim-drive-service";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "brand-assets";

const ALLOWED_PREFIXES = ["image/", "video/"];

export function isAllowedClaimMime(mime: string): boolean {
  const lower = mime.toLowerCase();
  return ALLOWED_PREFIXES.some((p) => lower.startsWith(p));
}

export async function uploadClaimEvidenceFile(params: {
  claimSessionId: string;
  category: GfClaimUploadCategory;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<GfClaimUploadedFile> {
  if (params.buffer.byteLength > GF_CLAIM_MAX_FILE_BYTES) {
    throw new Error("File exceeds 10 MB limit");
  }
  if (!isAllowedClaimMime(params.mimeType)) {
    throw new Error("Only image or video files are allowed");
  }

  if (isDriveClaimUploadConfigured()) {
    try {
      return await uploadClaimFileToDrive({
        claimSessionId: params.claimSessionId,
        category: params.category,
        fileName: params.fileName,
        mimeType: params.mimeType,
        buffer: params.buffer,
      });
    } catch (e) {
      console.warn("[claim upload] Drive failed, falling back to Supabase:", e);
    }
  }

  const ext = params.fileName.split(".").pop()?.toLowerCase() || "bin";
  const path = `gf-seed-claims/${params.claimSessionId}/${params.category}/${randomUUID()}.${ext}`;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, params.buffer, {
    cacheControl: "3600",
    upsert: false,
    contentType: params.mimeType,
  });
  if (error) throw new Error(error.message || "Storage upload failed");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    id: randomUUID(),
    name: params.fileName,
    mimeType: params.mimeType,
    sizeBytes: params.buffer.byteLength,
    storage: "supabase",
    publicUrl: data.publicUrl,
  };
}
