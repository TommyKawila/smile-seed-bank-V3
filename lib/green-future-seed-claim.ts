/** GF seed viability claim — Smile web form (forwards to GF process) */

import { GF_SEED_VIABILITY_CLAIM_FORM } from "@/lib/green-future-proforma-20260826";

export type GfSeedClaimLaunchStatus = "preview" | "live";

/** Flip to live after Regulatory Gate passes */
export const GF_SEED_CLAIM_LAUNCH_STATUS: GfSeedClaimLaunchStatus = "preview";

export function isGfSeedClaimPreview(): boolean {
  return GF_SEED_CLAIM_LAUNCH_STATUS === "preview";
}

export const GF_SEED_CLAIM_REFERENCE_FORM = GF_SEED_VIABILITY_CLAIM_FORM;

export type GfSeedClaimPayload = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  invoicePo: string;
  lotNumber: string;
  varietyCode: string;
  quantity: string;
  receivedDate: string;
  openedDate: string;
  storageLogNotes: string;
  germinationMethod: string;
  testCount: string;
  timeline: string;
  notes: string;
};

export const GF_SEED_CLAIM_REQUIRED_FIELDS: (keyof GfSeedClaimPayload)[] = [
  "contactName",
  "contactEmail",
  "invoicePo",
  "lotNumber",
  "varietyCode",
  "quantity",
  "receivedDate",
  "germinationMethod",
  "testCount",
];
