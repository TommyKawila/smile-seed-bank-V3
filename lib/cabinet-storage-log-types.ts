import type { CABINET_STORAGE_SPEC } from "@/lib/cabinet-storage-spec";

export type CabinetStorageLogEntryView = {
  id: string;
  loggedAt: string;
  tempC: number;
  rhPct: number;
  photoUrl: string;
  note: string | null;
  inSpec: boolean;
  createdAt: string;
};

export type CabinetStorageAdminView = {
  entries: CabinetStorageLogEntryView[];
  sharePath: string;
  shareUrl: string;
  loggedToday: boolean;
  spec: typeof CABINET_STORAGE_SPEC;
};

export type CabinetStoragePublicView = {
  latest: CabinetStorageLogEntryView | null;
  entries: CabinetStorageLogEntryView[];
  spec: typeof CABINET_STORAGE_SPEC;
};
