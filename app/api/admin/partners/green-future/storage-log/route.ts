import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import {
  createCabinetStorageEntry,
  getCabinetStorageAdminView,
  uploadCabinetStoragePhoto,
} from "@/services/cabinet-storage-log-service";

export const dynamic = "force-dynamic";

function originFrom(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.smileseedbank.com"
  );
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const data = await getCabinetStorageAdminView(originFrom(req));
    return NextResponse.json(data);
  } catch (e) {
    console.error("[storage-log GET]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Load failed" },
      { status: 500 }
    );
  }
}

const bodySchema = z.object({
  tempC: z.coerce.number().finite(),
  rhPct: z.coerce.number().finite(),
  note: z.string().max(500).optional().nullable(),
  loggedAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const form = await req.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse({
      tempC: form.get("tempC"),
      rhPct: form.get("rhPct"),
      note: form.get("note") ?? undefined,
      loggedAt: form.get("loggedAt") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadCabinetStoragePhoto({
      fileName: file.name,
      mimeType: file.type || "image/jpeg",
      buffer,
    });

    const entry = await createCabinetStorageEntry({
      tempC: parsed.data.tempC,
      rhPct: parsed.data.rhPct,
      note: parsed.data.note,
      loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : undefined,
      photoPath: uploaded.photoPath,
      photoUrl: uploaded.photoUrl,
    });

    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    console.error("[storage-log POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
