import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { uploadPackageImage } from "@/services/mockupService";

function isUploadBlob(value: FormDataEntryValue | null): value is Blob {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

export async function POST(req: Request) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!isUploadBlob(file) || file.size <= 0) {
      return NextResponse.json(
        { error: "file is required (valid image blob)" },
        { status: 400 }
      );
    }

    const name =
      "name" in file && typeof (file as File).name === "string"
        ? (file as File).name
        : "upload.jpg";
    const type =
      typeof file.type === "string" && file.type
        ? file.type
        : "application/octet-stream";

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPackageImage(buffer, name, type);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[mockups/upload]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
