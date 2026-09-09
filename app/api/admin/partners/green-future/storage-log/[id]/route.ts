import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import {
  deleteCabinetStorageEntry,
  updateCabinetStorageEntry,
  uploadCabinetStoragePhoto,
} from "@/services/cabinet-storage-log-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  tempC: z.coerce.number().finite().optional(),
  rhPct: z.coerce.number().finite().optional(),
  note: z.string().max(500).optional().nullable(),
  loggedAt: z.string().datetime().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const parsed = patchSchema.safeParse({
        tempC: form.get("tempC") ?? undefined,
        rhPct: form.get("rhPct") ?? undefined,
        note: form.get("note") ?? undefined,
        loggedAt: form.get("loggedAt") ?? undefined,
      });
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
      }

      const file = form.get("photo");
      let photoPath: string | undefined;
      let photoUrl: string | undefined;
      if (file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadCabinetStoragePhoto({
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          buffer,
        });
        photoPath = uploaded.photoPath;
        photoUrl = uploaded.photoUrl;
      }

      const entry = await updateCabinetStorageEntry(id, {
        tempC: parsed.data.tempC,
        rhPct: parsed.data.rhPct,
        note: parsed.data.note,
        loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : undefined,
        photoPath,
        photoUrl,
      });
      return NextResponse.json({ ok: true, entry });
    }

    const json = patchSchema.safeParse(await req.json());
    if (!json.success) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const entry = await updateCabinetStorageEntry(id, {
      tempC: json.data.tempC,
      rhPct: json.data.rhPct,
      note: json.data.note,
      loggedAt: json.data.loggedAt ? new Date(json.data.loggedAt) : undefined,
    });
    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    console.error("[storage-log PATCH]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  try {
    const ok = await deleteCabinetStorageEntry(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[storage-log DELETE]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
