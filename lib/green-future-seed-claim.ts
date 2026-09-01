/** GF seed viability claim — launch status + re-exports */

import { GF_SEED_VIABILITY_CLAIM_FORM } from "@/lib/green-future-proforma-20260826";

export type { GfSeedClaimFormData as GfSeedClaimPayload } from "@/lib/gf-seed-claim-form";
export {
  GF_CLAIM_STEPS,
  GF_CLAIM_MAX_FILES,
  GF_CLAIM_MAX_FILE_BYTES,
  createEmptyGfSeedClaimForm,
  validateGfClaimStep,
  buildGfClaimForwardSummary,
} from "@/lib/gf-seed-claim-form";
export type {
  GfClaimStepId,
  GfClaimUploadedFile,
  GfClaimUploadCategory,
} from "@/lib/gf-seed-claim-form";

export type GfSeedClaimLaunchStatus = "preview" | "live";

export const GF_SEED_CLAIM_LAUNCH_STATUS: GfSeedClaimLaunchStatus = "preview";

export function isGfSeedClaimPreview(): boolean {
  return GF_SEED_CLAIM_LAUNCH_STATUS === "preview";
}

export const GF_SEED_CLAIM_REFERENCE_FORM = GF_SEED_VIABILITY_CLAIM_FORM;
