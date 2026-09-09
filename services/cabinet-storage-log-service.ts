import "server-only";

import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  CABINET_STORAGE_SPEC,
  bangkokDateKey,
  isCabinetReadingInSpec,
} from "@/lib/cabinet-storage-spec";
import type {
  CabinetStorageAdminView,
  CabinetStorageLogEntryView,
  CabinetStoragePublicView,
} from "@/lib/cabinet-storage-log-types";
export type {
  CabinetStorageAdminView,
  CabinetStorageLogEntryView,
  CabinetStoragePublicView,
} from "@/lib/cabinet-storage-log-types";

import { createServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "brand-assets";
const SHARE_KEY = "gf";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function toView(row: {
  id: string;
  logged_at: Date;
  temp_c: { toNumber(): number } | number;
  rh_pct: { toNumber(): number } | number;
  photo_url: string;
  note: string | null;
  created_at: Date;
}): CabinetStorageLogEntryView {
  const tempC =
    typeof row.temp_c === "number" ? row.temp_c : row.temp_c.toNumber();
  const rhPct =
    typeof row.rh_pct === "number" ? row.rh_pct : row.rh_pct.toNumber();
  return {
    id: row.id,
    loggedAt: row.logged_at.toISOString(),
    tempC,
    rhPct,
    photoUrl: row.photo_url,
    note: row.note,
    inSpec: isCabinetReadingInSpec(tempC, rhPct),
    createdAt: row.created_at.toISOString(),
  };
}

function newShareToken(): string {
  return randomBytes(32).toString("base64url");
}

async function ensureShareRow() {
  const existing = await prisma.cabinet_storage_share.findUnique({
    where: { singleton_key: SHARE_KEY },
  });
  if (existing) return existing;
  return prisma.cabinet_storage_share.create({
    data: { singleton_key: SHARE_KEY, token: newShareToken() },
  });
}

export function cabinetStorageSharePath(token: string): string {
  return `/share/storage-log/${token}`;
}

export function cabinetStorageShareUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}${cabinetStorageSharePath(token)}`;
}

export async function getCabinetStorageAdminView(
  origin: string
): Promise<CabinetStorageAdminView> {
  const share = await ensureShareRow();
  const rows = await prisma.cabinet_storage_log_entries.findMany({
    orderBy: { logged_at: "desc" },
    take: 90,
  });
  const entries = rows.map(toView);
  const todayKey = bangkokDateKey(new Date());
  const loggedToday = entries.some(
    (e) => bangkokDateKey(e.loggedAt) === todayKey
  );
  return {
    entries,
    sharePath: cabinetStorageSharePath(share.token),
    shareUrl: cabinetStorageShareUrl(share.token, origin),
    loggedToday,
    spec: CABINET_STORAGE_SPEC,
  };
}

export async function rotateCabinetStorageShareToken(origin: string) {
  const share = await prisma.cabinet_storage_share.upsert({
    where: { singleton_key: SHARE_KEY },
    create: { singleton_key: SHARE_KEY, token: newShareToken() },
    update: { token: newShareToken(), rotated_at: new Date() },
  });
  return {
    sharePath: cabinetStorageSharePath(share.token),
    shareUrl: cabinetStorageShareUrl(share.token, origin),
    rotatedAt: share.rotated_at.toISOString(),
  };
}

export async function getCabinetStoragePublicView(
  token: string
): Promise<CabinetStoragePublicView | null> {
  const share = await prisma.cabinet_storage_share.findUnique({
    where: { token },
  });
  if (!share) return null;

  const since = new Date();
  since.setDate(since.getDate() - CABINET_STORAGE_SPEC.historyDays);

  const rows = await prisma.cabinet_storage_log_entries.findMany({
    where: { logged_at: { gte: since } },
    orderBy: { logged_at: "desc" },
  });
  const entries = rows.map(toView);
  return {
    latest: entries[0] ?? null,
    entries,
    spec: CABINET_STORAGE_SPEC,
  };
}

export async function uploadCabinetStoragePhoto(params: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ photoPath: string; photoUrl: string }> {
  if (params.buffer.byteLength > CABINET_STORAGE_SPEC.photoMaxBytes) {
    throw new Error("Photo exceeds 5 MB limit");
  }
  if (!ALLOWED_MIME.has(params.mimeType.toLowerCase())) {
    throw new Error("Only JPEG, PNG, or WebP images are allowed");
  }

  const ext =
    params.fileName.split(".").pop()?.toLowerCase() ||
    (params.mimeType.includes("png")
      ? "png"
      : params.mimeType.includes("webp")
        ? "webp"
        : "jpg");
  const photoPath = `cabinet-storage-log/${randomUUID()}.${ext}`;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).upload(photoPath, params.buffer, {
    cacheControl: "3600",
    upsert: false,
    contentType: params.mimeType,
  });
  if (error) throw new Error(error.message || "Storage upload failed");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(photoPath);
  return { photoPath, photoUrl: data.publicUrl };
}

export async function createCabinetStorageEntry(params: {
  tempC: number;
  rhPct: number;
  photoPath: string;
  photoUrl: string;
  note?: string | null;
  loggedAt?: Date;
}) {
  const row = await prisma.cabinet_storage_log_entries.create({
    data: {
      logged_at: params.loggedAt ?? new Date(),
      temp_c: params.tempC,
      rh_pct: params.rhPct,
      photo_path: params.photoPath,
      photo_url: params.photoUrl,
      note: params.note?.trim() || null,
    },
  });
  return toView(row);
}

export async function updateCabinetStorageEntry(
  id: string,
  params: {
    tempC?: number;
    rhPct?: number;
    note?: string | null;
    loggedAt?: Date;
    photoPath?: string;
    photoUrl?: string;
  }
) {
  const row = await prisma.cabinet_storage_log_entries.update({
    where: { id },
    data: {
      ...(params.tempC != null ? { temp_c: params.tempC } : {}),
      ...(params.rhPct != null ? { rh_pct: params.rhPct } : {}),
      ...(params.note !== undefined ? { note: params.note?.trim() || null } : {}),
      ...(params.loggedAt ? { logged_at: params.loggedAt } : {}),
      ...(params.photoPath && params.photoUrl
        ? { photo_path: params.photoPath, photo_url: params.photoUrl }
        : {}),
    },
  });
  return toView(row);
}

export async function deleteCabinetStorageEntry(id: string) {
  const row = await prisma.cabinet_storage_log_entries.findUnique({
    where: { id },
  });
  if (!row) return false;

  await prisma.cabinet_storage_log_entries.delete({ where: { id } });

  try {
    const supabase = createServiceRoleClient();
    await supabase.storage.from(BUCKET).remove([row.photo_path]);
  } catch (e) {
    console.warn("[cabinet-storage-log] photo delete failed:", e);
  }
  return true;
}
