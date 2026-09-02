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

/** Allow only http(s) hrefs. React 18 does not block `javascript:` URLs in production. */
export function safeHttpHref(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

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
