export type GacpFeaturedStrain = {
  varietyCode: string;
  strainName: string;
  displayName: string;
  seedFormat: "AUTO_FEM" | "FEM";
  typeLabel: string;
  thcRange: string;
  cbdNote: string;
  documents: string[];
};

/** Curated GACP marketing cards — code-first refs aligned with Green Future. */
export const GACP_FEATURED_STRAINS: GacpFeaturedStrain[] = [
  {
    varietyCode: "AF29",
    strainName: "GORILLA COOKIES AUTO",
    displayName: "Gorilla Cookies Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Balanced Hybrid",
    thcRange: "24–28%",
    cbdNote: "Low",
    documents: ["Variety code", "Lot / test data", "Lab extras on request"],
  },
  {
    varietyCode: "PF024",
    strainName: "PERMANENT MARKER",
    displayName: "Permanent Marker",
    seedFormat: "FEM",
    typeLabel: "Hybrid",
    thcRange: "26–30%",
    cbdNote: "Low",
    documents: ["Variety code", "Lot / test data", "Lab extras on request"],
  },
  {
    varietyCode: "AF121",
    strainName: "ZOAP AUTO",
    displayName: "Zoap Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Balanced Hybrid",
    thcRange: "23–26%",
    cbdNote: "<1%",
    documents: ["Variety code", "Lot / test data", "Lab extras on request"],
  },
  {
    varietyCode: "AF138",
    strainName: "GELATO AUTO",
    displayName: "Gelato Auto",
    seedFormat: "AUTO_FEM",
    typeLabel: "Indica-dominant",
    thcRange: "24–25%",
    cbdNote: "Low",
    documents: ["Variety code", "Lot / test data", "Lab extras on request"],
  },
];

export function formatGacpVarietyRef(code: string, name: string): string {
  return `${code.trim().toUpperCase()} (${name.trim().toUpperCase()})`;
}
