"use client";

import { useRef, useState } from "react";
import { ChevronDown, Copy, Download, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontScaleControls } from "@/components/mockup/FontScaleControls";
import { ImageUploader } from "@/components/mockup/ImageUploader";
import { LabelForm } from "@/components/mockup/LabelForm";
import { MockupControls } from "@/components/mockup/MockupControls";
import { StickerSizeControls } from "@/components/mockup/StickerSizeControls";
import { useMockup } from "@/components/mockup/MockupContext";
import { VisualPreview } from "@/components/mockup/VisualPreview";
import { formatCm } from "@/lib/mockup-dimensions";
import {
  exportDomElementAsFile,
  type ExportImageFormat,
} from "@/lib/save-dom-image";
import { useToast } from "@/hooks/use-toast";

export function MockupWorkspace() {
  const { data, setLabelPosition, setData, saving, setSaving } = useMockup();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function saveAndCopyLink() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mockups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        data?: typeof data;
        shareUrl?: string;
        error?: unknown;
      };
      if (!res.ok || !body.shareUrl || !body.data) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Save failed"
        );
      }
      setData(body.data);
      await navigator.clipboard.writeText(body.shareUrl);
      toast({
        title: "Saved — link copied",
        description: body.shareUrl,
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function exportFile(format: ExportImageFormat) {
    const el = previewRef.current;
    if (!el || exporting) return;
    setExporting(true);
    try {
      const base = `label-mockup-${data.strainName || data.id}`;
      const ok = await exportDomElementAsFile(el, format, base, "#f8fafc");
      if (!ok) {
        toast({
          title: "Export failed",
          description: "Could not render preview",
          variant: "destructive",
        });
        return;
      }
      const ext = format === "jpeg" ? "JPG" : format.toUpperCase();
      toast({ title: `Downloaded ${ext}` });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Package sticker mockup
          </h2>
          <p className="text-xs text-slate-500">
            Upload pack photo, set sticker to {formatCm(data.labelSizeCm.width)} ×{" "}
            {formatCm(data.labelSizeCm.height)} cm, drag on preview, then export.
          </p>
        </div>

        <ImageUploader />

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sticker size
          </h3>
          <StickerSizeControls />
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Font size
          </h3>
          <FontScaleControls />
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Label content
          </h3>
          <LabelForm />
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Position &amp; fine-tune
          </h3>
          <MockupControls />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button type="button" disabled={saving} onClick={saveAndCopyLink}>
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-1.5 h-4 w-4" />
            )}
            Save &amp; Get Link
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Export
                <ChevronDown className="ml-1 h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => void exportFile("png")}>
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportFile("jpeg")}>
                Download JPG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportFile("pdf")}>
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/share/mockup/${data.id}`;
              void navigator.clipboard.writeText(url).then(() =>
                toast({ title: "Link copied (save first if new)" })
              );
            }}
          >
            <Copy className="mr-1.5 h-4 w-4" />
            Copy URL
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
          <p className="text-[11px] text-slate-500">
            Dashed box = sticker · amber = pack bounds
          </p>
        </div>
        <VisualPreview
          ref={previewRef}
          data={data}
          interactive
          onPositionChange={setLabelPosition}
        />
      </div>
    </div>
  );
}
