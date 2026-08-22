export type GacpFeaturedStrain = {
  varietyCode: string;
  strainName: string;
  displayName: string;
  seedFormat: "AUTO_FEM" | "FEM";
  typeLabel: string;
  documents: string[];
};

/** Curated GACP marketing cards — code-first refs aligned with Green Future. */
export const GACP_FEATURED_STRAINS: GacpFeaturedStrain[] = [
  {
    varietyCode: "AF99",
    strainName: "BUBBA KUSH AUTO",
    displayName: "Bubba Kush Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Indica-dominant",
    documents: ["Variety code", "Lot / test data", "External lab COA on request"],
  },
  {
    varietyCode: "AF143",
    strainName: "DO-SI-DOS AUTO",
    displayName: "Do-Si-Dos Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Indica-dominant",
    documents: ["Variety code", "Lot / test data", "External lab COA on request"],
  },
  {
    varietyCode: "AF02",
    strainName: "NORTHERN LIGHTS AUTO",
    displayName: "Northern Lights Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Indica-dominant",
    documents: ["Variety code", "Lot / test data", "External lab COA on request"],
  },
  {
    varietyCode: "AF22",
    strainName: "PINEAPPLE EXPRESS AUTO",
    displayName: "Pineapple Express Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Sativa-dominant",
    documents: ["Variety code", "Lot / test data", "External lab COA on request"],
  },
];

export function formatGacpVarietyRef(code: string, name: string): string {
  return `${code.trim().toUpperCase()} (${name.trim().toUpperCase()})`;
}
