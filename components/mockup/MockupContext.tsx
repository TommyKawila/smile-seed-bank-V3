"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createEmptySeedLabelData,
  type LabelPosition,
  type SeedLabelData,
} from "@/types/label";

type MockupContextValue = {
  data: SeedLabelData;
  setField: <K extends keyof SeedLabelData>(key: K, value: SeedLabelData[K]) => void;
  setLabelPosition: (patch: Partial<LabelPosition>) => void;
  setData: (next: SeedLabelData) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
};

const MockupContext = createContext<MockupContextValue | null>(null);

export function MockupProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: SeedLabelData;
}) {
  const [data, setData] = useState<SeedLabelData>(
    () => initial ?? createEmptySeedLabelData()
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = useCallback(
    <K extends keyof SeedLabelData>(key: K, value: SeedLabelData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setLabelPosition = useCallback((patch: Partial<LabelPosition>) => {
    setData((prev) => ({
      ...prev,
      labelPosition: { ...prev.labelPosition, ...patch },
    }));
  }, []);

  const value = useMemo(
    () => ({
      data,
      setField,
      setLabelPosition,
      setData,
      uploading,
      setUploading,
      saving,
      setSaving,
    }),
    [data, setField, setLabelPosition, uploading, saving]
  );

  return (
    <MockupContext.Provider value={value}>{children}</MockupContext.Provider>
  );
}

export function useMockup() {
  const ctx = useContext(MockupContext);
  if (!ctx) throw new Error("useMockup must be used within MockupProvider");
  return ctx;
}
