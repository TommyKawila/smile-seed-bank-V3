"use client";

import { useRef } from "react";
import { Copy, Download, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/mockup/ImageUploader";
import { LabelForm } from "@/components/mockup/LabelForm";
import { MockupControls } from "@/components/mockup/MockupControls";
import { useMockup } from "@/components/mockup/MockupContext";
import { VisualPreview } from "@/components/mockup/VisualPreview";
import {
  domElementToPngBlob,
  saveOrSharePngBlob,
} from "@/lib/save-dom-image";
import { useToast } from "@/hooks/use-toast";

export function MockupWorkspace() {
  const { data, setLabelPosition, setData, saving, setSaving } = useMockup();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

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

  async function exportPng() {
    const el = previewRef.current;
    if (!el) return;
    const blob = await domElementToPngBlob(el, "#f8fafc");
    if (!blob) {
      toast({
        title: "Export failed",
        description: "Could not render preview",
        variant: "destructive",
      });
      return;
    }
    const name = `label-mockup-${data.strainName || data.id}.png`.replace(
      /\s+/g,
      "-"
    );
    const result = await saveOrSharePngBlob(blob, name, "Label mockup");
    if (result === "failed") {
      toast({ title: "Export failed", variant: "destructive" });
    } else if (result === "downloaded" || result === "shared") {
      toast({ title: result === "shared" ? "Shared" : "PNG downloaded" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Label data</h2>
          <p className="text-xs text-slate-500">
            Fill fields, upload package, position the label, then save or export.
          </p>
        </div>
        <LabelForm />
        <ImageUploader />
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Position
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
          <Button type="button" variant="outline" onClick={exportPng}>
            <Download className="mr-1.5 h-4 w-4" />
            Export Image
          </Button>
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
        <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
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
