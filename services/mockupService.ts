import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseFontScale, parseLabelSizeCm } from "@/lib/mockup-dimensions";
import {
  DEFAULT_FONT_SCALE,
  DEFAULT_LABEL_POSITION,
  DEFAULT_LABEL_SIZE_CM,
  DEFAULT_SPECIES,
  DEFAULT_STORAGE_TH,
  type LabelPosition,
  type LabelSizeCm,
  type SeedLabelData,
} from "@/types/label";
import type { Prisma } from "@prisma/client";

export const MOCKUP_BUCKET = "brand-assets";
/** Stay under Vercel serverless body limit (~4.5MB). */
const MAX_BYTES = 4 * 1024 * 1024;

function resolveImageContentType(
  contentType: string,
  filename: string
): "image/jpeg" | "image/png" | "image/webp" | null {
  const lower = (contentType || "").toLowerCase().trim();
  if (lower === "image/jpg" || lower === "image/jpeg") return "image/jpeg";
  if (lower === "image/png") return "image/png";
  if (lower === "image/webp") return "image/webp";

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export async function uploadPackageImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const resolved = resolveImageContentType(contentType, filename);
  if (!resolved) {
    throw new Error(
      "Only JPEG, PNG, or WebP images are allowed (HEIC/other formats not supported — convert first)"
    );
  }
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(
      "Image must be under 4MB (compress or resize the photo, then try again)"
    );
  }

  const ext =
    resolved === "image/png" ? "png" : resolved === "image/webp" ? "webp" : "jpg";
  const path = `mockups/${randomUUID()}.${ext}`;
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage.from(MOCKUP_BUCKET).upload(path, buffer, {
    cacheControl: "3600",
    upsert: false,
    contentType: resolved,
  });
  if (error) throw new Error(error.message || "Storage upload failed");

  const { data } = supabase.storage.from(MOCKUP_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function parsePosition(raw: unknown): {
  position: LabelPosition;
  labelSizeCm: LabelSizeCm;
  fontScale: number;
} {
  if (!raw || typeof raw !== "object") {
    return {
      position: { ...DEFAULT_LABEL_POSITION },
      labelSizeCm: { ...DEFAULT_LABEL_SIZE_CM },
      fontScale: DEFAULT_FONT_SCALE,
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    position: {
      x: typeof o.x === "number" ? o.x : DEFAULT_LABEL_POSITION.x,
      y: typeof o.y === "number" ? o.y : DEFAULT_LABEL_POSITION.y,
      scale: typeof o.scale === "number" ? o.scale : DEFAULT_LABEL_POSITION.scale,
      rotation:
        typeof o.rotation === "number"
          ? o.rotation
          : DEFAULT_LABEL_POSITION.rotation,
      unit: o.unit === "ratio" || o.unit === "px" ? o.unit : undefined,
    },
    labelSizeCm: parseLabelSizeCm(o.labelSizeCm),
    fontScale: parseFontScale(o.fontScale),
  };
}

function serializeLabelPosition(data: SeedLabelData): Prisma.InputJsonValue {
  return {
    ...data.labelPosition,
    labelSizeCm: data.labelSizeCm ?? DEFAULT_LABEL_SIZE_CM,
    fontScale: data.fontScale ?? DEFAULT_FONT_SCALE,
  };
}

function rowToSeedLabel(row: {
  id: string;
  species: string;
  strain_name: string;
  lot_no: string;
  trademark: string;
  collection_source: string;
  quantity: number;
  purity: number;
  germination: number;
  collected_date: string;
  tested_date: string;
  expiry_date: string;
  producer_name: string;
  producer_license_rp2: string;
  distributor_name: string;
  distributor_license_pp3: string;
  address: string;
  storage_instructions: string;
  bg_image_url: string | null;
  label_position: Prisma.JsonValue;
}): SeedLabelData {
  return {
    id: row.id,
    species: row.species || DEFAULT_SPECIES,
    strainName: row.strain_name,
    lotNo: row.lot_no ?? "",
    trademark: row.trademark ?? "",
    quantity: row.quantity,
    purity: row.purity,
    germination: row.germination,
    collectedDate: row.collected_date,
    testedDate: row.tested_date,
    expiryDate: row.expiry_date,
    collectionSource: row.collection_source ?? "",
    producerName: row.producer_name,
    producerLicensePP: row.producer_license_rp2,
    distributorName: row.distributor_name,
    distributorLicensePP4: row.distributor_license_pp3,
    address: row.address,
    storageInstructions: row.storage_instructions || DEFAULT_STORAGE_TH,
    bgImageUrl: row.bg_image_url ?? undefined,
    ...(() => {
      const parsed = parsePosition(row.label_position);
      return {
        labelPosition: parsed.position,
        labelSizeCm: parsed.labelSizeCm,
        fontScale: parsed.fontScale,
      };
    })(),
  };
}

export async function saveMockup(data: SeedLabelData): Promise<SeedLabelData> {
  const id = data.id?.trim() || randomUUID();
  const payload = {
    species: data.species?.trim() || DEFAULT_SPECIES,
    strain_name: data.strainName?.trim() || "",
    lot_no: data.lotNo?.trim() || "",
    trademark: data.trademark?.trim() || "",
    collection_source: data.collectionSource?.trim() || "",
    quantity: Math.max(0, Math.floor(Number(data.quantity) || 0)),
    purity: Number(data.purity) || 0,
    germination: Number(data.germination) || 0,
    collected_date: data.collectedDate?.trim() || "",
    tested_date: data.testedDate?.trim() || "",
    expiry_date: data.expiryDate?.trim() || "",
    producer_name: data.producerName?.trim() || "",
    producer_license_rp2: data.producerLicensePP?.trim() || "",
    distributor_name: data.distributorName?.trim() || "",
    distributor_license_pp3: data.distributorLicensePP4?.trim() || "",
    address: data.address?.trim() || "",
    storage_instructions: data.storageInstructions?.trim() || DEFAULT_STORAGE_TH,
    bg_image_url: data.bgImageUrl?.trim() || null,
    label_position: serializeLabelPosition({
      ...data,
      labelPosition: data.labelPosition ?? DEFAULT_LABEL_POSITION,
      labelSizeCm: data.labelSizeCm ?? DEFAULT_LABEL_SIZE_CM,
    }),
  };

  const row = await prisma.label_mockups.upsert({
    where: { id },
    create: { id, ...payload },
    update: payload,
  });

  return rowToSeedLabel(row);
}

export async function getMockupById(id: string): Promise<SeedLabelData | null> {
  const row = await prisma.label_mockups.findUnique({ where: { id } });
  if (!row) return null;
  return rowToSeedLabel(row);
}
