import "server-only";

import { prisma } from "@/lib/prisma";
import {
  GF_ADDITIVES,
  GF_DECAY_SIGNS,
  GF_EXPERIENCE,
  GF_GROWING_MEDIUM,
  GF_LOCATION,
  GF_METHOD_USED,
  GF_MOISTENED_OFTEN,
  GF_MOISTURE_COVER,
  GF_MOISTURE_TRANSFER,
  GF_PLANTING_DEPTH,
  GF_RADICLE_DAMAGED,
  GF_RADICLE_POSITION,
  GF_RESULT,
  GF_ROOT_LENGTH,
  GF_TIME_TO_ROOT,
  GF_TRANSFER_METHOD,
  GF_WATER_TYPE,
  GF_YES_NO,
  GF_YES_NO_UNSURE,
  buildGfClaimForwardSummary,
  gfClaimOptionLabel,
  gfClaimOptionLabels,
  type GfClaimUploadedFile,
  type GfSeedClaimFormData,
} from "@/lib/gf-seed-claim-form";
import type { GfSeedClaimPayload } from "@/lib/green-future-seed-claim";
import {
  safeHttpHref,
  type GfClaimFileView,
  type GfSeedClaimDetail,
  type GfSeedClaimListItem,
} from "@/lib/gf-seed-claim-admin";

export type {
  GfClaimFileView,
  GfClaimSectionView,
  GfSeedClaimDetail,
  GfSeedClaimListItem,
} from "@/lib/gf-seed-claim-admin";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function str(rec: Record<string, unknown>, key: string): string {
  const v = rec[key];
  return typeof v === "string" ? v.trim() : "";
}

function strArr(rec: Record<string, unknown>, key: string): string[] {
  const v = rec[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function bool(rec: Record<string, unknown>, key: string): boolean {
  return rec[key] === true;
}

function dash(v: string): string {
  return v.trim() ? v : "—";
}

function withOther(
  ids: string[],
  other: string,
  options: { id: string; en: string; th: string }[]
): string {
  const base = gfClaimOptionLabels(options, ids);
  if (ids.includes("other") && other.trim()) return `${base}: ${other.trim()}`;
  return base;
}

function radioWithOther(
  id: string,
  other: string,
  options: { id: string; en: string; th: string }[]
): string {
  if (!id) return "—";
  const base = gfClaimOptionLabel(options, id);
  if (id === "other" && other.trim()) return `${base}: ${other.trim()}`;
  return base;
}

function parseFiles(rec: Record<string, unknown>, key: string): GfClaimUploadedFile[] {
  const v = rec[key];
  if (!Array.isArray(v)) return [];
  const out: GfClaimUploadedFile[] = [];
  for (const item of v) {
    const row = asRecord(item);
    if (!row) continue;
    const name = str(row, "name");
    const mimeType = str(row, "mimeType");
    const storage = str(row, "storage");
    const sizeBytes = typeof row.sizeBytes === "number" ? row.sizeBytes : 0;
    if (!name) continue;
    out.push({
      id: str(row, "id") || name,
      name,
      mimeType,
      sizeBytes,
      storage: storage === "google_drive" ? "google_drive" : "supabase",
      fileId: str(row, "fileId") || undefined,
      webViewLink: str(row, "webViewLink") || undefined,
      publicUrl: str(row, "publicUrl") || undefined,
    });
  }
  return out;
}

function fileView(f: GfClaimUploadedFile): GfClaimFileView {
  return {
    name: f.name,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    storage: f.storage,
    href: safeHttpHref(f.webViewLink || f.publicUrl),
  };
}

function storageOf(files: GfClaimUploadedFile[]): GfSeedClaimListItem["storage"] {
  if (!files.length) return "none";
  const set = new Set(files.map((f) => f.storage));
  if (set.size > 1) return "mixed";
  if (set.has("google_drive")) return "google_drive";
  return "supabase";
}

function isFullForm(rec: Record<string, unknown>): boolean {
  return typeof rec.nameOrNickname === "string" && typeof rec.email === "string";
}

function toFormData(rec: Record<string, unknown>): GfSeedClaimFormData | null {
  if (!isFullForm(rec)) return null;
  return {
    claimSessionId: str(rec, "claimSessionId"),
    nameOrNickname: str(rec, "nameOrNickname"),
    email: str(rec, "email"),
    phoneOrMessenger: str(rec, "phoneOrMessenger"),
    purchaseDate: str(rec, "purchaseDate"),
    claimSubmissionDate: str(rec, "claimSubmissionDate"),
    orderNumber: str(rec, "orderNumber"),
    strainName: str(rec, "strainName"),
    lotNumber: str(rec, "lotNumber"),
    openedDate: str(rec, "openedDate"),
    storageLogNotes: str(rec, "storageLogNotes"),
    methodUsed: strArr(rec, "methodUsed"),
    methodUsedOther: str(rec, "methodUsedOther"),
    processStepByStep: str(rec, "processStepByStep"),
    waterType: strArr(rec, "waterType"),
    waterTypeOther: str(rec, "waterTypeOther"),
    soakDuration: str(rec, "soakDuration"),
    location: str(rec, "location"),
    locationOther: str(rec, "locationOther"),
    carriedOutBy: str(rec, "carriedOutBy"),
    experienceLevel: str(rec, "experienceLevel"),
    previouslyGerminated: str(rec, "previouslyGerminated"),
    sameMethodAllSeeds: str(rec, "sameMethodAllSeeds"),
    methodsBreakdown: str(rec, "methodsBreakdown"),
    additives: strArr(rec, "additives"),
    additivesOther: str(rec, "additivesOther"),
    germinationTempC: str(rec, "germinationTempC"),
    atLeastOneRoot: str(rec, "atLeastOneRoot"),
    result: strArr(rec, "result"),
    resultOther: str(rec, "resultOther"),
    seedsUsedForGermination: str(rec, "seedsUsedForGermination"),
    seedsDevelopedRoot: str(rec, "seedsDevelopedRoot"),
    seedsUnused: str(rec, "seedsUnused"),
    seedsSwelled: str(rec, "seedsSwelled"),
    firstRadicleDate: str(rec, "firstRadicleDate"),
    firstRadicleTime: str(rec, "firstRadicleTime"),
    seedsFailedRoot: str(rec, "seedsFailedRoot"),
    timeToFirstRoot: str(rec, "timeToFirstRoot"),
    rootLengthAtTransfer: strArr(rec, "rootLengthAtTransfer"),
    transferMethod: str(rec, "transferMethod"),
    growingMedium: strArr(rec, "growingMedium"),
    growingMediumOther: str(rec, "growingMediumOther"),
    mediumPrepared: str(rec, "mediumPrepared"),
    moistureAtTransfer: str(rec, "moistureAtTransfer"),
    phEc: str(rec, "phEc"),
    plantingDepth: str(rec, "plantingDepth"),
    radiclePosition: str(rec, "radiclePosition"),
    radicleDamaged: str(rec, "radicleDamaged"),
    decaySigns: strArr(rec, "decaySigns"),
    decaySignsOther: str(rec, "decaySignsOther"),
    airTempAfterC: str(rec, "airTempAfterC"),
    rhAfter: str(rec, "rhAfter"),
    moistureCover: str(rec, "moistureCover"),
    moistureCoverOther: str(rec, "moistureCoverOther"),
    moistenedHowOften: str(rec, "moistenedHowOften"),
    moistenedHowOftenOther: str(rec, "moistenedHowOftenOther"),
    radicleFirstEmergedRecorded: str(rec, "radicleFirstEmergedRecorded"),
    extraMediaUrl: str(rec, "extraMediaUrl"),
    packagingAndLotPhotos: parseFiles(rec, "packagingAndLotPhotos"),
    claimedSeedsPhotos: parseFiles(rec, "claimedSeedsPhotos"),
    processPhotosVideos: parseFiles(rec, "processPhotosVideos"),
    confirmAccurate: bool(rec, "confirmAccurate"),
    confirmPhotosMatch: bool(rec, "confirmPhotosMatch"),
    confirmNoAutoCompensation: bool(rec, "confirmNoAutoCompensation"),
    confirmDataProcessing: bool(rec, "confirmDataProcessing"),
  };
}

function listFromRecord(id: string, createdAt: Date, rec: Record<string, unknown>): GfSeedClaimListItem {
  const form = toFormData(rec);
  if (form) {
    const allFiles = [
      ...form.packagingAndLotPhotos,
      ...form.claimedSeedsPhotos,
      ...form.processPhotosVideos,
    ];
    return {
      id,
      createdAt: createdAt.toISOString(),
      name: form.nameOrNickname,
      email: form.email,
      phone: form.phoneOrMessenger,
      lotNumber: form.lotNumber,
      strainName: form.strainName,
      orderNumber: form.orderNumber,
      result: withOther(form.result, form.resultOther, GF_RESULT),
      packagingCount: form.packagingAndLotPhotos.length,
      claimedSeedsCount: form.claimedSeedsPhotos.length,
      processCount: form.processPhotosVideos.length,
      storage: storageOf(allFiles),
    };
  }
  return {
    id,
    createdAt: createdAt.toISOString(),
    name: str(rec, "contactName") || str(rec, "nameOrNickname"),
    email: str(rec, "contactEmail") || str(rec, "email"),
    phone: str(rec, "contactPhone") || str(rec, "phoneOrMessenger"),
    lotNumber: str(rec, "lotNumber"),
    strainName: str(rec, "varietyCode") || str(rec, "strainName"),
    orderNumber: str(rec, "invoicePo") || str(rec, "orderNumber"),
    result: str(rec, "notes") || "—",
    packagingCount: 0,
    claimedSeedsCount: 0,
    processCount: 0,
    storage: "none",
  };
}

function yesNo(v: boolean): string {
  return v ? "Yes" : "No";
}

function detailFromRecord(id: string, createdAt: Date, rec: Record<string, unknown>): GfSeedClaimDetail {
  const form = toFormData(rec);
  if (!form) {
    const rows = Object.entries(rec).map(([label, value]) => ({
      label,
      value: typeof value === "string" ? dash(value) : JSON.stringify(value),
    }));
    return {
      id,
      createdAt: createdAt.toISOString(),
      forwardSummary: [
        "GF Seed Viability Claim — Smile Seed Bank intake (legacy payload)",
        `Contact: ${str(rec, "contactName")} · ${str(rec, "contactEmail")} · ${str(rec, "contactPhone")}`,
        `Lot: ${str(rec, "lotNumber")} · Variety: ${str(rec, "varietyCode")}`,
      ].join("\n"),
      extraMediaUrl: "",
      sections: [{ title: "Legacy payload", rows }],
      files: { packaging: [], claimedSeeds: [], process: [] },
    };
  }

  return {
    id,
    createdAt: createdAt.toISOString(),
    forwardSummary: buildGfClaimForwardSummary(form),
    extraMediaUrl: form.extraMediaUrl,
    files: {
      packaging: form.packagingAndLotPhotos.map(fileView),
      claimedSeeds: form.claimedSeedsPhotos.map(fileView),
      process: form.processPhotosVideos.map(fileView),
    },
    sections: [
      {
        title: "Contact",
        rows: [
          { label: "Name", value: dash(form.nameOrNickname) },
          { label: "Email", value: dash(form.email) },
          { label: "Phone / messenger", value: dash(form.phoneOrMessenger) },
        ],
      },
      {
        title: "Purchase",
        rows: [
          { label: "Purchase date", value: dash(form.purchaseDate) },
          { label: "Claim date", value: dash(form.claimSubmissionDate) },
          { label: "Invoice / receipt", value: dash(form.orderNumber) },
          { label: "Strain", value: dash(form.strainName) },
          { label: "Lot number", value: dash(form.lotNumber) },
          { label: "Pouch opened", value: dash(form.openedDate) },
          { label: "Storage log", value: dash(form.storageLogNotes) },
        ],
      },
      {
        title: "Germination method",
        rows: [
          { label: "Method", value: withOther(form.methodUsed, form.methodUsedOther, GF_METHOD_USED) },
          { label: "Process", value: dash(form.processStepByStep) },
          { label: "Water", value: withOther(form.waterType, form.waterTypeOther, GF_WATER_TYPE) },
          { label: "Soak duration", value: dash(form.soakDuration) },
          { label: "Location", value: radioWithOther(form.location, form.locationOther, GF_LOCATION) },
          { label: "Carried out by", value: dash(form.carriedOutBy) },
          { label: "Experience", value: form.experienceLevel ? gfClaimOptionLabel(GF_EXPERIENCE, form.experienceLevel) : "—" },
          { label: "Previously germinated", value: form.previouslyGerminated ? gfClaimOptionLabel(GF_YES_NO_UNSURE, form.previouslyGerminated) : "—" },
          { label: "Same method all seeds", value: form.sameMethodAllSeeds ? gfClaimOptionLabel(GF_YES_NO_UNSURE, form.sameMethodAllSeeds) : "—" },
          { label: "Methods breakdown", value: dash(form.methodsBreakdown) },
          { label: "Additives", value: withOther(form.additives, form.additivesOther, GF_ADDITIVES) },
          { label: "Temp °C", value: dash(form.germinationTempC) },
          { label: "At least one root", value: form.atLeastOneRoot ? gfClaimOptionLabel(GF_YES_NO, form.atLeastOneRoot) : "—" },
        ],
      },
      {
        title: "Results",
        rows: [
          { label: "Result", value: withOther(form.result, form.resultOther, GF_RESULT) },
          { label: "Seeds used", value: dash(form.seedsUsedForGermination) },
          { label: "Developed root", value: dash(form.seedsDevelopedRoot) },
          { label: "Unused", value: dash(form.seedsUnused) },
          { label: "Swelled", value: dash(form.seedsSwelled) },
          { label: "First radicle", value: dash(`${form.firstRadicleDate} ${form.firstRadicleTime}`.trim()) },
          { label: "Failed root", value: dash(form.seedsFailedRoot) },
          { label: "Time to first root", value: form.timeToFirstRoot ? gfClaimOptionLabel(GF_TIME_TO_ROOT, form.timeToFirstRoot) : "—" },
        ],
      },
      {
        title: "Transfer",
        rows: [
          { label: "Root length", value: gfClaimOptionLabels(GF_ROOT_LENGTH, form.rootLengthAtTransfer) },
          { label: "Transfer method", value: form.transferMethod ? gfClaimOptionLabel(GF_TRANSFER_METHOD, form.transferMethod) : "—" },
          { label: "Growing medium", value: withOther(form.growingMedium, form.growingMediumOther, GF_GROWING_MEDIUM) },
          { label: "Medium prepared", value: form.mediumPrepared ? gfClaimOptionLabel(GF_YES_NO_UNSURE, form.mediumPrepared) : "—" },
          { label: "Moisture", value: form.moistureAtTransfer ? gfClaimOptionLabel(GF_MOISTURE_TRANSFER, form.moistureAtTransfer) : "—" },
          { label: "pH / EC", value: dash(form.phEc) },
          { label: "Planting depth", value: form.plantingDepth ? gfClaimOptionLabel(GF_PLANTING_DEPTH, form.plantingDepth) : "—" },
          { label: "Radicle position", value: form.radiclePosition ? gfClaimOptionLabel(GF_RADICLE_POSITION, form.radiclePosition) : "—" },
          { label: "Radicle damaged", value: form.radicleDamaged ? gfClaimOptionLabel(GF_RADICLE_DAMAGED, form.radicleDamaged) : "—" },
          { label: "Decay signs", value: withOther(form.decaySigns, form.decaySignsOther, GF_DECAY_SIGNS) },
        ],
      },
      {
        title: "After transfer",
        rows: [
          { label: "Air temp °C", value: dash(form.airTempAfterC) },
          { label: "RH %", value: dash(form.rhAfter) },
          { label: "Moisture cover", value: radioWithOther(form.moistureCover, form.moistureCoverOther, GF_MOISTURE_COVER) },
          { label: "Moistened how often", value: radioWithOther(form.moistenedHowOften, form.moistenedHowOftenOther, GF_MOISTENED_OFTEN) },
        ],
      },
      {
        title: "Confirmation",
        rows: [
          { label: "Accurate", value: yesNo(form.confirmAccurate) },
          { label: "Photos match", value: yesNo(form.confirmPhotosMatch) },
          { label: "No auto compensation", value: yesNo(form.confirmNoAutoCompensation) },
          { label: "Data processing", value: yesNo(form.confirmDataProcessing) },
          { label: "First radicle recorded", value: form.radicleFirstEmergedRecorded ? gfClaimOptionLabel(GF_YES_NO, form.radicleFirstEmergedRecorded) : "—" },
          { label: "Session", value: dash(form.claimSessionId) },
        ],
      },
    ],
  };
}

export async function saveGfSeedClaimSubmission(
  payload: GfSeedClaimPayload
): Promise<{ id: string }> {
  const row = await prisma.gf_seed_claim_submissions.create({
    data: { payload },
  });
  return { id: row.id };
}

export async function listGfSeedClaimSubmissions(): Promise<GfSeedClaimListItem[]> {
  const rows = await prisma.gf_seed_claim_submissions.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });
  return rows.map((row) => listFromRecord(row.id, row.created_at, asRecord(row.payload) ?? {}));
}

export async function getGfSeedClaimSubmission(
  id: string
): Promise<GfSeedClaimDetail | null> {
  const row = await prisma.gf_seed_claim_submissions.findUnique({
    where: { id },
  });
  if (!row) return null;
  return detailFromRecord(row.id, row.created_at, asRecord(row.payload) ?? {});
}
