/** GF Seed Viability Claim — field schema, options, defaults, step validation */

export type GfClaimStepId =
  | "intro"
  | "contact"
  | "purchase"
  | "method"
  | "results"
  | "transfer"
  | "after"
  | "evidence"
  | "confirm";

export const GF_CLAIM_STEPS: GfClaimStepId[] = [
  "intro",
  "contact",
  "purchase",
  "method",
  "results",
  "transfer",
  "after",
  "evidence",
  "confirm",
];

export type GfClaimUploadedFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storage: "google_drive" | "supabase";
  fileId?: string;
  webViewLink?: string;
  publicUrl?: string;
};

export type GfClaimUploadCategory =
  | "packaging"
  | "claimedSeeds"
  | "process";

export type GfSeedClaimFormData = {
  claimSessionId: string;
  nameOrNickname: string;
  email: string;
  phoneOrMessenger: string;
  purchaseDate: string;
  claimSubmissionDate: string;
  orderNumber: string;
  strainName: string;
  lotNumber: string;
  openedDate: string;
  storageLogNotes: string;
  methodUsed: string[];
  methodUsedOther: string;
  processStepByStep: string;
  waterType: string[];
  waterTypeOther: string;
  soakDuration: string;
  location: string;
  locationOther: string;
  carriedOutBy: string;
  experienceLevel: string;
  previouslyGerminated: string;
  sameMethodAllSeeds: string;
  methodsBreakdown: string;
  additives: string[];
  additivesOther: string;
  germinationTempC: string;
  atLeastOneRoot: string;
  result: string[];
  resultOther: string;
  seedsUsedForGermination: string;
  seedsDevelopedRoot: string;
  seedsUnused: string;
  seedsSwelled: string;
  firstRadicleDate: string;
  firstRadicleTime: string;
  seedsFailedRoot: string;
  timeToFirstRoot: string;
  rootLengthAtTransfer: string[];
  transferMethod: string;
  growingMedium: string[];
  growingMediumOther: string;
  mediumPrepared: string;
  moistureAtTransfer: string;
  phEc: string;
  plantingDepth: string;
  radiclePosition: string;
  radicleDamaged: string;
  decaySigns: string[];
  decaySignsOther: string;
  airTempAfterC: string;
  rhAfter: string;
  moistureCover: string;
  moistureCoverOther: string;
  moistenedHowOften: string;
  moistenedHowOftenOther: string;
  radicleFirstEmergedRecorded: string;
  extraMediaUrl: string;
  packagingAndLotPhotos: GfClaimUploadedFile[];
  claimedSeedsPhotos: GfClaimUploadedFile[];
  processPhotosVideos: GfClaimUploadedFile[];
  confirmAccurate: boolean;
  confirmPhotosMatch: boolean;
  confirmNoAutoCompensation: boolean;
  confirmDataProcessing: boolean;
};

export type GfClaimOption = { id: string; en: string; th: string };

export const GF_METHOD_USED: GfClaimOption[] = [
  { id: "pre_soak", en: "Pre-soaking in water", th: "แช่น้ำก่อนเพาะ" },
  { id: "paper_towel", en: "Moist paper towels or tissues", th: "กระดาษ/ทิชชู่ชื้น" },
  { id: "cotton_pads", en: "Cotton pads", th: "สำลีชุบน้ำ" },
  { id: "direct_medium", en: "Directly in the growing medium", th: "ปลูกลงวัสดุปลูกโดยตรง" },
  { id: "rockwool", en: "Rockwool", th: "ร็อกวูล" },
  { id: "peat_coco_plug", en: "Peat or coco plugs", th: "ปลั๊กพีทหรือโคโค" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_WATER_TYPE: GfClaimOption[] = [
  { id: "bottled", en: "Bottled water", th: "น้ำดื่มบรรจุขวด" },
  { id: "filtered", en: "Filtered water", th: "น้ำกรอง" },
  { id: "ro", en: "Reverse osmosis (RO) water", th: "น้ำ RO" },
  { id: "distilled", en: "Distilled water", th: "น้ำกลั่น" },
  { id: "tap", en: "Tap water", th: "น้ำประปา" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_LOCATION: GfClaimOption[] = [
  { id: "indoors", en: "Indoors", th: "ในร่ม" },
  { id: "grow_room", en: "Grow room", th: "ห้องปลูก" },
  { id: "greenhouse", en: "Greenhouse", th: "โรงเรือน" },
  { id: "outdoor", en: "Outdoor area", th: "กลางแจ้ง" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_EXPERIENCE: GfClaimOption[] = [
  { id: "beginner", en: "Beginner — little or no previous experience", th: "เริ่มต้น — ประสบการณ์น้อยหรือไม่มี" },
  { id: "some", en: "Some experience", th: "มีประสบการณ์บ้าง" },
  { id: "experienced", en: "Experienced grower or cultivation professional", th: "มีประสบการณ์สูง / มืออาชีพ" },
];

export const GF_YES_NO_UNSURE: GfClaimOption[] = [
  { id: "yes", en: "Yes", th: "ใช่" },
  { id: "no", en: "No", th: "ไม่ใช่" },
  { id: "not_sure", en: "Not sure", th: "ไม่แน่ใจ" },
];

export const GF_YES_NO: GfClaimOption[] = [
  { id: "yes", en: "Yes", th: "ใช่" },
  { id: "no", en: "No", th: "ไม่ใช่" },
];

export const GF_ADDITIVES: GfClaimOption[] = [
  { id: "none", en: "No additives were used", th: "ไม่ใช้สารเติม" },
  { id: "h2o2", en: "Hydrogen peroxide", th: "ไฮโดรเจนเปอร์ออกไซด์" },
  { id: "stimulant", en: "Germination stimulant", th: "สารกระตุ้นการงอก" },
  { id: "fertilizer", en: "Fertilizer", th: "ปุ๋ย" },
  { id: "ph", en: "pH-adjusting solution", th: "สารปรับ pH" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_RESULT: GfClaimOption[] = [
  { id: "none_swelled", en: "None of the seeds swelled or developed a root", th: "ไม่บวมและไม่งอกรากเลย" },
  { id: "swelled_no_root", en: "The seeds swelled, but no root appeared", th: "บวมแต่ไม่มีราก" },
  { id: "some_root", en: "Some seeds developed a root, while others did not", th: "บางเมล็ดงอกราก บางเมล็ดไม่" },
  { id: "root_no_growth", en: "The seeds developed a root but failed to grow after being transferred", th: "งอกรากแต่ไม่โตหลังย้าย" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_TIME_TO_ROOT: GfClaimOption[] = [
  { id: "lt24", en: "Less than 24 hours", th: "น้อยกว่า 24 ชม." },
  { id: "24_48", en: "24–48 hours", th: "24–48 ชม." },
  { id: "48_72", en: "48–72 hours", th: "48–72 ชม." },
  { id: "gt72", en: "More than 72 hours", th: "มากกว่า 72 ชม." },
  { id: "none", en: "No root appeared", th: "ไม่มีราก" },
];

export const GF_ROOT_LENGTH: GfClaimOption[] = [
  { id: "lt2", en: "Less than 2 mm", th: "น้อยกว่า 2 มม." },
  { id: "2_5", en: "2–5 mm", th: "2–5 มม." },
  { id: "5_10", en: "5–10 mm", th: "5–10 มม." },
  { id: "gt10", en: "More than 10 mm", th: "มากกว่า 10 มม." },
  { id: "not_measured", en: "Not measured", th: "ไม่ได้วัด" },
];

export const GF_TRANSFER_METHOD: GfClaimOption[] = [
  { id: "hand", en: "By hand", th: "มือเปล่า" },
  { id: "tweezers", en: "With tweezers", th: "ใช้แหนบ" },
  { id: "tool", en: "With another tool", th: "ใช้เครื่องมืออื่น" },
  { id: "direct", en: "Germinated directly in the growing medium (no transfer)", th: "งอกในวัสดุปลูกโดยตรง (ไม่ย้าย)" },
];

export const GF_GROWING_MEDIUM: GfClaimOption[] = [
  { id: "rockwool", en: "Rockwool", th: "ร็อกวูล" },
  { id: "peat", en: "Peat", th: "พีท" },
  { id: "coco", en: "Coco coir", th: "โคโค" },
  { id: "soil", en: "Soil mix", th: "ดินปลูก" },
  { id: "plug", en: "Peat or coco plug", th: "ปลั๊กพีท/โคโค" },
  { id: "other", en: "Other growing medium", th: "วัสดุปลูกอื่น" },
];

export const GF_MOISTURE_TRANSFER: GfClaimOption[] = [
  { id: "slightly", en: "Slightly moist", th: "ชื้นเล็กน้อย" },
  { id: "moist", en: "Moist but not saturated", th: "ชื้นแต่ไม่อิ่มตัว" },
  { id: "wet", en: "Very wet or saturated", th: "เปียกมาก/อิ่มตัว" },
  { id: "dry", en: "Dry", th: "แห้ง" },
  { id: "not_checked", en: "Not checked", th: "ไม่ได้ตรวจ" },
  { id: "unable", en: "Unable to determine", th: "ไม่สามารถระบุได้" },
];

export const GF_PLANTING_DEPTH: GfClaimOption[] = [
  { id: "lt05", en: "Less than 0.5 cm", th: "น้อยกว่า 0.5 ซม." },
  { id: "05_1", en: "0.5–1 cm", th: "0.5–1 ซม." },
  { id: "gt1", en: "More than 1 cm", th: "มากกว่า 1 ซม." },
  { id: "surface", en: "Placed on the surface", th: "วางบนผิว" },
  { id: "not_measured", en: "Not measured", th: "ไม่ได้วัด" },
  { id: "unable", en: "Unable to determine", th: "ไม่สามารถระบุได้" },
];

export const GF_RADICLE_POSITION: GfClaimOption[] = [
  { id: "down", en: "Pointing downward", th: "ชี้ลง" },
  { id: "sideways", en: "Pointing sideways", th: "ชี้ข้าง" },
  { id: "up", en: "Pointing upward", th: "ชี้ขึ้น" },
  { id: "not_controlled", en: "Position was not controlled", th: "ไม่ได้ควบคุมทิศทาง" },
  { id: "unable", en: "Unable to determine", th: "ไม่สามารถระบุได้" },
];

export const GF_RADICLE_DAMAGED: GfClaimOption[] = [
  { id: "yes", en: "Yes", th: "ใช่" },
  { id: "no", en: "No", th: "ไม่ใช่" },
  { id: "possibly", en: "Possibly", th: "เป็นไปได้" },
  { id: "unable", en: "Unable to determine", th: "ไม่สามารถระบุได้" },
];

export const GF_DECAY_SIGNS: GfClaimOption[] = [
  { id: "no", en: "No", th: "ไม่มี" },
  { id: "mold", en: "Mold", th: "รา" },
  { id: "odor", en: "Unpleasant or sour odor", th: "กลิ่นไม่พึงประสงค์" },
  { id: "darkening", en: "Darkening of the root", th: "รากเข้มขึ้น" },
  { id: "rotting", en: "Rotting", th: "เน่า" },
  { id: "unable", en: "Unable to determine", th: "ไม่สามารถระบุได้" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_MOISTURE_COVER: GfClaimOption[] = [
  { id: "none", en: "No cover was used", th: "ไม่ใช้ฝาครอบ" },
  { id: "dome", en: "Humidity dome", th: "โดมความชื้น" },
  { id: "propagator", en: "Mini-propagator", th: "มินิโพรพากาเตอร์" },
  { id: "plastic", en: "Plastic cover or bag", th: "พลาสติกคลุม/ถุง" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_MOISTENED_OFTEN: GfClaimOption[] = [
  { id: "gt_daily", en: "More than once per day", th: "มากกว่าวันละครั้ง" },
  { id: "daily", en: "Once per day", th: "วันละครั้ง" },
  { id: "2_3_days", en: "Every 2–3 days", th: "ทุก 2–3 วัน" },
  { id: "when_dry", en: "Only when the medium appeared dry", th: "เมื่อแห้งเท่านั้น" },
  { id: "not_again", en: "It was not moistened again", th: "ไม่ได้ชุบน้ำอีก" },
  { id: "other", en: "Other", th: "อื่น ๆ" },
];

export const GF_CLAIM_MAX_FILES = 5;
export const GF_CLAIM_MAX_FILE_BYTES = 10 * 1024 * 1024;

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyGfSeedClaimForm(
  claimSessionId?: string
): GfSeedClaimFormData {
  return {
    claimSessionId: claimSessionId ?? crypto.randomUUID(),
    nameOrNickname: "",
    email: "",
    phoneOrMessenger: "",
    purchaseDate: "",
    claimSubmissionDate: todayIsoDate(),
    orderNumber: "",
    strainName: "",
    lotNumber: "",
    openedDate: "",
    storageLogNotes: "",
    methodUsed: [],
    methodUsedOther: "",
    processStepByStep: "",
    waterType: [],
    waterTypeOther: "",
    soakDuration: "",
    location: "",
    locationOther: "",
    carriedOutBy: "",
    experienceLevel: "",
    previouslyGerminated: "",
    sameMethodAllSeeds: "",
    methodsBreakdown: "",
    additives: [],
    additivesOther: "",
    germinationTempC: "",
    atLeastOneRoot: "",
    result: [],
    resultOther: "",
    seedsUsedForGermination: "",
    seedsDevelopedRoot: "",
    seedsUnused: "",
    seedsSwelled: "",
    firstRadicleDate: "",
    firstRadicleTime: "",
    seedsFailedRoot: "",
    timeToFirstRoot: "",
    rootLengthAtTransfer: [],
    transferMethod: "",
    growingMedium: [],
    growingMediumOther: "",
    mediumPrepared: "",
    moistureAtTransfer: "",
    phEc: "",
    plantingDepth: "",
    radiclePosition: "",
    radicleDamaged: "",
    decaySigns: [],
    decaySignsOther: "",
    airTempAfterC: "",
    rhAfter: "",
    moistureCover: "",
    moistureCoverOther: "",
    moistenedHowOften: "",
    moistenedHowOftenOther: "",
    radicleFirstEmergedRecorded: "",
    extraMediaUrl: "",
    packagingAndLotPhotos: [],
    claimedSeedsPhotos: [],
    processPhotosVideos: [],
    confirmAccurate: false,
    confirmPhotosMatch: false,
    confirmNoAutoCompensation: false,
    confirmDataProcessing: false,
  };
}

function hasText(v: string): boolean {
  return v.trim().length > 0;
}

function hasSelection(values: string[]): boolean {
  return values.length > 0;
}

function needsOther(values: string[], other: string): boolean {
  return !values.includes("other") || hasText(other);
}

export function validateGfClaimStep(
  step: GfClaimStepId,
  data: GfSeedClaimFormData
): string | null {
  switch (step) {
    case "intro":
      return null;
    case "contact":
      if (!hasText(data.nameOrNickname)) return "nameOrNickname";
      if (!hasText(data.email)) return "email";
      if (!hasText(data.phoneOrMessenger)) return "phoneOrMessenger";
      return null;
    case "purchase":
      if (!hasText(data.purchaseDate)) return "purchaseDate";
      if (!hasText(data.claimSubmissionDate)) return "claimSubmissionDate";
      if (!hasText(data.lotNumber)) return "lotNumber";
      return null;
    case "method":
      if (!hasSelection(data.methodUsed) || !needsOther(data.methodUsed, data.methodUsedOther))
        return "methodUsed";
      if (!hasText(data.processStepByStep)) return "processStepByStep";
      if (!hasSelection(data.waterType) || !needsOther(data.waterType, data.waterTypeOther))
        return "waterType";
      if (!hasText(data.soakDuration)) return "soakDuration";
      if (!hasText(data.location)) return "location";
      if (data.location === "other" && !hasText(data.locationOther)) return "locationOther";
      if (!hasText(data.carriedOutBy)) return "carriedOutBy";
      if (!hasText(data.experienceLevel)) return "experienceLevel";
      if (!hasText(data.previouslyGerminated)) return "previouslyGerminated";
      if (!hasText(data.sameMethodAllSeeds)) return "sameMethodAllSeeds";
      if (!hasSelection(data.additives) || !needsOther(data.additives, data.additivesOther))
        return "additives";
      if (!hasText(data.germinationTempC)) return "germinationTempC";
      if (!hasText(data.atLeastOneRoot)) return "atLeastOneRoot";
      return null;
    case "results":
      if (!hasSelection(data.result) || !needsOther(data.result, data.resultOther))
        return "result";
      if (!hasText(data.seedsDevelopedRoot)) return "seedsDevelopedRoot";
      if (!hasText(data.seedsUnused)) return "seedsUnused";
      if (!hasText(data.seedsSwelled)) return "seedsSwelled";
      if (!hasText(data.firstRadicleDate)) return "firstRadicleDate";
      if (!hasText(data.firstRadicleTime)) return "firstRadicleTime";
      if (!hasText(data.seedsFailedRoot)) return "seedsFailedRoot";
      if (!hasText(data.timeToFirstRoot)) return "timeToFirstRoot";
      return null;
    case "transfer":
      if (!hasSelection(data.rootLengthAtTransfer)) return "rootLengthAtTransfer";
      if (!hasSelection(data.growingMedium) || !needsOther(data.growingMedium, data.growingMediumOther))
        return "growingMedium";
      if (!hasText(data.mediumPrepared)) return "mediumPrepared";
      if (!hasText(data.moistureAtTransfer)) return "moistureAtTransfer";
      if (!hasText(data.plantingDepth)) return "plantingDepth";
      if (!hasText(data.radiclePosition)) return "radiclePosition";
      if (!hasText(data.radicleDamaged)) return "radicleDamaged";
      if (!hasSelection(data.decaySigns) || !needsOther(data.decaySigns, data.decaySignsOther))
        return "decaySigns";
      return null;
    case "after":
      if (!hasText(data.moistenedHowOften)) return "moistenedHowOften";
      if (data.moistenedHowOften === "other" && !hasText(data.moistenedHowOftenOther))
        return "moistenedHowOftenOther";
      if (data.moistureCover === "other" && !hasText(data.moistureCoverOther))
        return "moistureCoverOther";
      return null;
    case "evidence":
      if (data.packagingAndLotPhotos.length < 1) return "packagingAndLotPhotos";
      if (!hasText(data.radicleFirstEmergedRecorded)) return "radicleFirstEmergedRecorded";
      if (data.claimedSeedsPhotos.length < 1) return "claimedSeedsPhotos";
      if (data.processPhotosVideos.length < 1) return "processPhotosVideos";
      return null;
    case "confirm":
      if (!data.confirmAccurate) return "confirmAccurate";
      if (!data.confirmPhotosMatch) return "confirmPhotosMatch";
      if (!data.confirmNoAutoCompensation) return "confirmNoAutoCompensation";
      if (!data.confirmDataProcessing) return "confirmDataProcessing";
      return null;
    default:
      return null;
  }
}

export function gfClaimOptionLabel(options: GfClaimOption[], id: string): string {
  const hit = options.find((o) => o.id === id);
  return hit ? `${hit.en} (${hit.th})` : id;
}

export function gfClaimOptionLabels(options: GfClaimOption[], ids: string[]): string {
  if (!ids.length) return "—";
  return ids.map((id) => gfClaimOptionLabel(options, id)).join("; ");
}

export function buildGfClaimForwardSummary(data: GfSeedClaimFormData): string {
  const lines = [
    "GF Seed Viability Claim — Smile Seed Bank intake",
    `Session: ${data.claimSessionId}`,
    `Contact: ${data.nameOrNickname} · ${data.email} · ${data.phoneOrMessenger}`,
    `Purchase: ${data.purchaseDate} · Claim date: ${data.claimSubmissionDate}`,
    `Order: ${data.orderNumber || "—"} · Strain: ${data.strainName || "—"} · Lot: ${data.lotNumber}`,
    `Germination result: ${data.result.join(", ")}`,
    `Seeds used/root/unused/swelled/failed: ${data.seedsUsedForGermination}/${data.seedsDevelopedRoot}/${data.seedsUnused}/${data.seedsSwelled}/${data.seedsFailedRoot}`,
    `First radicle: ${data.firstRadicleDate} ${data.firstRadicleTime}`,
    `Packaging files: ${data.packagingAndLotPhotos.length} · Seed files: ${data.claimedSeedsPhotos.length} · Process files: ${data.processPhotosVideos.length}`,
    data.extraMediaUrl ? `Extra media: ${data.extraMediaUrl}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}
