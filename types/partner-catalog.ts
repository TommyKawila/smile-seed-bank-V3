export type PartnerSeedFormat = "AUTO_FEM" | "FEM";
export type PartnerStockStatus = "IN_STOCK" | "PRE_ORDER" | "OUT" | "UNKNOWN";
export type PartnerIstaStatus = "NONE" | "CONFIRMED" | "REQUESTED";
export type PartnerDocType =
  | "CATALOG_AUTO_FEM"
  | "CATALOG_FEM"
  | "ISTA_LETTER"
  | "OTHER";

export type PartnerSupplierRecord = {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  address: string | null;
  taxId: string | null;
  email: string | null;
  notes: string | null;
};

export type PartnerDocumentRecord = {
  id: string;
  supplierId: string;
  title: string;
  docType: PartnerDocType;
  fileUrl: string;
  fileName: string;
  mime: string;
  issuedAt: string | null;
  refCode: string | null;
  notes: string | null;
};

export type PartnerStrainRecord = {
  id: string;
  supplierId: string;
  varietyCode: string;
  strainName: string;
  seedFormat: PartnerSeedFormat;
  thcRange: string | null;
  cbdNote: string | null;
  cycleDays: string | null;
  heightCm: string | null;
  yieldGm2: string | null;
  typeLabel: string | null;
  stockStatus: PartnerStockStatus;
  dominantTerpene: string | null;
  secondaryTerpene: string | null;
  flavor1: string | null;
  flavor2: string | null;
  istaStatus: PartnerIstaStatus;
  istaNotes: string | null;
  sourceDocumentId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PartnerStrainListResult = {
  strains: PartnerStrainRecord[];
  total: number;
};

export const GREEN_FUTURE_SLUG = "green-future";

export function formatPartnerVarietyRef(
  varietyCode: string,
  strainName: string
): string {
  const code = varietyCode.trim().toUpperCase();
  const name = strainName.trim().toUpperCase();
  return `${code} (${name})`;
}
