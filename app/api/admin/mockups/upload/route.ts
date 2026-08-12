import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { uploadPackageImage } from "@/services/mockupService";

export async function POST(req: Request) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPackageImage(
      buffer,
      file.name,
      file.type || "image/jpeg"
    );
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[mockups/upload]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
