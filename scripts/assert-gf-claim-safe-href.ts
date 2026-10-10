import { safeHttpHref } from "../lib/gf-seed-claim-admin";
import { gfSeedClaimPayloadSchema } from "../lib/gf-seed-claim-zod";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}

assert(safeHttpHref("https://drive.google.com/file/d/abc")?.startsWith("https://"), "https kept");
assert(safeHttpHref("http://example.com/a.jpg")?.startsWith("http://"), "http kept");
assert(safeHttpHref("javascript:alert(1)") === undefined, "javascript blocked");
assert(safeHttpHref("JAVASCRIPT:alert(document.cookie)") === undefined, "js case blocked");
assert(safeHttpHref("  javascript:alert(1)") === undefined, "js padded blocked");
assert(safeHttpHref("data:text/html,<script>alert(1)</script>") === undefined, "data blocked");
assert(safeHttpHref("vbscript:msgbox(1)") === undefined, "vbscript blocked");
assert(safeHttpHref("") === undefined, "empty blocked");
assert(safeHttpHref("/relative") === undefined, "relative blocked");

const file = {
  id: "f1",
  name: "a.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 12,
  storage: "supabase" as const,
  publicUrl: "https://example.com/a.jpg",
};

function basePayload() {
  return {
    claimSessionId: "00000000-0000-4000-8000-000000000001",
    nameOrNickname: "A",
    email: "a@b.co",
    phoneOrMessenger: "1",
    purchaseDate: "2026-01-01",
    claimSubmissionDate: "2026-01-02",
    lotNumber: "L1",
    methodUsed: ["paper_towel"],
    processStepByStep: "steps",
    waterType: ["tap"],
    soakDuration: "1h",
    location: "indoor",
    carriedOutBy: "me",
    experienceLevel: "beginner",
    previouslyGerminated: "yes",
    sameMethodAllSeeds: "yes",
    additives: ["none"],
    germinationTempC: "24",
    atLeastOneRoot: "no",
    result: ["no_germ"],
    seedsDevelopedRoot: "0",
    seedsUnused: "0",
    seedsSwelled: "0",
    firstRadicleDate: "2026-01-03",
    firstRadicleTime: "08:00",
    seedsFailedRoot: "5",
    timeToFirstRoot: "none",
    rootLengthAtTransfer: ["na"],
    growingMedium: ["soil"],
    mediumPrepared: "yes",
    moistureAtTransfer: "moist",
    plantingDepth: "surface",
    radiclePosition: "down",
    radicleDamaged: "no",
    decaySigns: ["none"],
    moistenedHowOften: "daily",
    radicleFirstEmergedRecorded: "no" as const,
    packagingAndLotPhotos: [file],
    claimedSeedsPhotos: [file],
    processPhotosVideos: [file],
    confirmAccurate: true as const,
    confirmPhotosMatch: true as const,
    confirmNoAutoCompensation: true as const,
    confirmDataProcessing: true as const,
  };
}

assert(gfSeedClaimPayloadSchema.safeParse(basePayload()).success, "valid payload accepted");
assert(
  !gfSeedClaimPayloadSchema.safeParse({
    ...basePayload(),
    extraMediaUrl: "javascript:alert(1)",
  }).success,
  "extraMediaUrl javascript rejected"
);
assert(
  !gfSeedClaimPayloadSchema.safeParse({
    ...basePayload(),
    packagingAndLotPhotos: [{ ...file, publicUrl: "javascript:alert(1)" }],
  }).success,
  "file publicUrl javascript rejected"
);
assert(
  gfSeedClaimPayloadSchema.safeParse({
    ...basePayload(),
    extraMediaUrl: "https://photos.example.com/album",
  }).success,
  "https extraMediaUrl accepted"
);

console.log("ok: gf claim hrefs reject javascript:/data: URLs");
