export const MANUAL_GRID_IMPORT_KEY = "ssb_manual_grid_import_v1";

export type ManualGridImportDraft = {
  name: string;
  masterSku: string;
  category?: string;
  strainDominance?: string | null;
  byPack: Record<number, { stock: number; cost: number; price: number }>;
};

export type ManualGridImportPayload = {
  v: 1;
  breederId: string;
  drafts: ManualGridImportDraft[];
};

export function saveManualGridImport(payload: ManualGridImportPayload): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(MANUAL_GRID_IMPORT_KEY, JSON.stringify(payload));
}

export function peekManualGridImport(): ManualGridImportPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(MANUAL_GRID_IMPORT_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as ManualGridImportPayload;
    if (p?.v === 1 && typeof p.breederId === "string" && Array.isArray(p.drafts)) return p;
    return null;
  } catch {
    return null;
  }
}

export function consumeManualGridImport(): ManualGridImportPayload | null {
  const p = peekManualGridImport();
  if (p && typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(MANUAL_GRID_IMPORT_KEY);
  }
  return p;
}
