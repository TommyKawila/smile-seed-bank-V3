import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GF_CLAIM_MAX_FILES,
  type GfClaimUploadCategory,
} from "@/lib/gf-seed-claim-form";
import {
  isAllowedClaimMime,
  uploadClaimEvidenceFile,
} from "@/services/gf-seed-claim-upload-service";

const categorySchema = z.enum(["packaging", "claimedSeeds", "process"]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const claimSessionId = String(form.get("claimSessionId") ?? "").trim();
    const categoryRaw = String(form.get("category") ?? "").trim();
    const parsedCategory = categorySchema.safeParse(categoryRaw);
    if (!claimSessionId || !parsedCategory.success) {
      return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
    }
    const category = parsedCategory.data as GfClaimUploadCategory;

    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length < 1 || files.length > GF_CLAIM_MAX_FILES) {
      return NextResponse.json(
        { error: `Upload 1–${GF_CLAIM_MAX_FILES} files per request` },
        { status: 400 }
      );
    }

    const uploaded = [];
    for (const file of files) {
      if (!isAllowedClaimMime(file.type)) {
        return NextResponse.json(
          { error: "Only image or video files are allowed" },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const row = await uploadClaimEvidenceFile({
        claimSessionId,
        category,
        fileName: file.name,
        mimeType: file.type,
        buffer,
      });
      uploaded.push(row);
    }

    return NextResponse.json({ ok: true, files: uploaded });
  } catch (e) {
    console.error("[claim/seeds/upload POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
