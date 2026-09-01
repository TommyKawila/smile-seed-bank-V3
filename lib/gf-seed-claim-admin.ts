export type GfSeedClaimListItem = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  lotNumber: string;
  strainName: string;
  orderNumber: string;
  result: string;
  packagingCount: number;
  claimedSeedsCount: number;
  processCount: number;
  storage: "google_drive" | "supabase" | "mixed" | "none";
};

export type GfClaimFileView = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  storage: string;
  href?: string;
};

export type GfClaimSectionView = {
  title: string;
  rows: { label: string; value: string }[];
};

export type GfSeedClaimDetail = {
  id: string;
  createdAt: string;
  forwardSummary: string;
  extraMediaUrl: string;
  sections: GfClaimSectionView[];
  files: {
    packaging: GfClaimFileView[];
    claimedSeeds: GfClaimFileView[];
    process: GfClaimFileView[];
  };
};
