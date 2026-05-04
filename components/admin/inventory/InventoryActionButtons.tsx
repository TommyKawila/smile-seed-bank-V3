"use client";

import { Loader2, Plus, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InventoryActionButtons({
  canExport,
  exporting,
  batchSyncing,
  batchSyncLabel,
  syncableNewCount,
  breederSelected,
  onExportPng,
  onExportPdf,
  onSyncNewItems,
  onAddStrain,
}: {
  canExport: boolean;
  exporting: "png" | "pdf" | null;
  batchSyncing: boolean;
  batchSyncLabel: string;
  syncableNewCount: number;
  breederSelected: boolean;
  onExportPng: () => void;
  onExportPdf: () => void;
  onSyncNewItems: () => void;
  onAddStrain: () => void;
}) {
  return (
    <>
      {canExport && (
        <>
          <Button size="sm" variant="outline" onClick={onExportPng} disabled={!!exporting} className="border-primary/30 text-primary hover:bg-accent">
            {exporting === "png" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : "📸"} Export PNG
          </Button>
          <Button size="sm" variant="outline" onClick={onExportPdf} disabled={!!exporting} className="border-primary/30 text-primary hover:bg-accent">
            {exporting === "pdf" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : "📄"} Export PDF
          </Button>
        </>
      )}
      {breederSelected && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={onSyncNewItems}
            disabled={syncableNewCount === 0 || batchSyncing}
            className="border-primary/40 text-primary hover:border-primary/60 hover:bg-accent"
            title="Sync all new draft strains in the current filtered view (Master SKU required)."
          >
            {batchSyncing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-1 h-4 w-4" />
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              </>
            )}
            {syncableNewCount > 0 ? `Sync ${syncableNewCount} New Items` : "Sync New Items"}
            {batchSyncing && batchSyncLabel ? ` (${batchSyncLabel})` : ""}
          </Button>
          <Button size="sm" onClick={onAddStrain} disabled={batchSyncing} className="bg-primary text-white hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Add New Strain
          </Button>
        </>
      )}
    </>
  );
}
