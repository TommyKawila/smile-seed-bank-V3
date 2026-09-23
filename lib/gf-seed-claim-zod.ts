import { z } from "zod";
import { safeHttpHref } from "@/lib/gf-seed-claim-admin";

const optionalHttpUrl = z
  .string()
  .optional()
  .refine((s) => s == null || s === "" || Boolean(safeHttpHref(s)), {
    message: "URL must be http or https",
  });

const uploadedFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  storage: z.enum(["google_drive", "supabase"]),
  fileId: z.string().optional(),
  webViewLink: optionalHttpUrl,
  publicUrl: optionalHttpUrl,
});

export const gfSeedClaimPayloadSchema = z.object({
  claimSessionId: z.string().uuid(),
  nameOrNickname: z.string().min(1),
  email: z.string().email(),
  phoneOrMessenger: z.string().min(1),
  purchaseDate: z.string().min(1),
  claimSubmissionDate: z.string().min(1),
  orderNumber: z.string().default(""),
  strainName: z.string().default(""),
  lotNumber: z.string().min(1),
  openedDate: z.string().default(""),
  storageLogNotes: z.string().default(""),
  methodUsed: z.array(z.string()).min(1),
  methodUsedOther: z.string().default(""),
  processStepByStep: z.string().min(1),
  waterType: z.array(z.string()).min(1),
  waterTypeOther: z.string().default(""),
  soakDuration: z.string().min(1),
  location: z.string().min(1),
  locationOther: z.string().default(""),
  carriedOutBy: z.string().min(1),
  experienceLevel: z.string().min(1),
  previouslyGerminated: z.string().min(1),
  sameMethodAllSeeds: z.string().min(1),
  methodsBreakdown: z.string().default(""),
  additives: z.array(z.string()).min(1),
  additivesOther: z.string().default(""),
  germinationTempC: z.string().min(1),
  atLeastOneRoot: z.string().min(1),
  result: z.array(z.string()).min(1),
  resultOther: z.string().default(""),
  seedsUsedForGermination: z.string().default(""),
  seedsDevelopedRoot: z.string().min(1),
  seedsUnused: z.string().min(1),
  seedsSwelled: z.string().min(1),
  firstRadicleDate: z.string().min(1),
  firstRadicleTime: z.string().min(1),
  seedsFailedRoot: z.string().min(1),
  timeToFirstRoot: z.string().min(1),
  rootLengthAtTransfer: z.array(z.string()).min(1),
  transferMethod: z.string().default(""),
  growingMedium: z.array(z.string()).min(1),
  growingMediumOther: z.string().default(""),
  mediumPrepared: z.string().min(1),
  moistureAtTransfer: z.string().min(1),
  phEc: z.string().default(""),
  plantingDepth: z.string().min(1),
  radiclePosition: z.string().min(1),
  radicleDamaged: z.string().min(1),
  decaySigns: z.array(z.string()).min(1),
  decaySignsOther: z.string().default(""),
  airTempAfterC: z.string().default(""),
  rhAfter: z.string().default(""),
  moistureCover: z.string().default(""),
  moistureCoverOther: z.string().default(""),
  moistenedHowOften: z.string().min(1),
  moistenedHowOftenOther: z.string().default(""),
  radicleFirstEmergedRecorded: z.enum(["yes", "no"]),
  extraMediaUrl: z
    .string()
    .default("")
    .refine((s) => s === "" || Boolean(safeHttpHref(s)), {
      message: "URL must be http or https",
    }),
  packagingAndLotPhotos: z.array(uploadedFileSchema).min(1),
  claimedSeedsPhotos: z.array(uploadedFileSchema).min(1),
  processPhotosVideos: z.array(uploadedFileSchema).min(1),
  confirmAccurate: z.literal(true),
  confirmPhotosMatch: z.literal(true),
  confirmNoAutoCompensation: z.literal(true),
  confirmDataProcessing: z.literal(true),
});
