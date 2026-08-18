import type { PartnerStrainRecord } from "@/types/partner-catalog";

/** Client-safe SGF display helpers. No cost / GM / landed math. */

export const SGF_SEEDS_SHARE_NAME = "SGF Seeds";
export const SGF_SEEDS_SHARE_TAGLINE = "Smile Seed Bank × Green Future Thailand";

export type SgfStrainBucket = "autoflower" | "photo" | "photo-ff";

export const SGF_STRAIN_BUCKET_ORDER: SgfStrainBucket[] = ["autoflower", "photo", "photo-ff"];

export const SGF_STRAIN_BUCKET_LABEL: Record<SgfStrainBucket, string> = {
  autoflower: "Autoflower",
  photo: "Photo",
  "photo-ff": "Photo FF",
};

export function sgfStrainBucket(strain: PartnerStrainRecord): SgfStrainBucket {
  const code = strain.varietyCode.trim().toUpperCase();
  if (code.startsWith("AF")) return "autoflower";
  if (code.startsWith("FF")) return "photo-ff";
  const typeHay = `${strain.typeLabel ?? ""} ${strain.strainName}`.toLowerCase();
  if (typeHay.includes("fast flowering") || typeHay.includes("fast-flowering")) {
    return "photo-ff";
  }
  return "photo";
}

export function sgfStrainsGrouped(strains: PartnerStrainRecord[]) {
  return SGF_STRAIN_BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: SGF_STRAIN_BUCKET_LABEL[bucket],
    strains: strains.filter((s) => sgfStrainBucket(s) === bucket),
  })).filter((g) => g.strains.length > 0);
}
