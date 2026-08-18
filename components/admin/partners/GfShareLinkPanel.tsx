"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  BULK_SUPPLIER_BOOKS,
  DEFAULT_EUR_THB,
  type BulkSupplierSlug,
} from "@/lib/bulk-seeds-book";
import { mintButtonLabel } from "@/lib/bulk-share-presets";

const GF_SLUG: BulkSupplierSlug = "green-future";
const gfBook = BULK_SUPPLIER_BOOKS.find((b) => b.slug === GF_SLUG);

export function GfShareLinkPanel() {
  const { toast } = useToast();
  const [shareTitle, setShareTitle] = useState("SGF Seeds — bulk offer");
  const [shareDays, setShareDays] = useState(14);
  const [showStrains, setShowStrains] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  async function mintLink() {
    setBusy(true);
    setLink(null);
    try {
      const res = await fetch("/api/admin/bulk-seeds/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: shareTitle,
          days: shareDays,
          suppliers: [GF_SLUG],
          showStrains,
          landed: { [GF_SLUG]: gfBook?.recommendedLandedPct ?? 10 },
          eurThb: DEFAULT_EUR_THB,
        }),
      });
      const json = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !json.path) throw new Error(json.error ?? "Failed");
      const url = `${window.location.origin}${json.path}`;
      setLink(url);
      await navigator.clipboard.writeText(url);
      toast({ title: "คัดลอกลิงก์ GF-only แล้ว", description: url });
    } catch (err) {
      toast({
        title: "สร้างลิงก์ไม่สำเร็จ",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-[#12463e]/30 bg-[#12463e]/5 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#12463e]">
          GF-only share link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs leading-relaxed text-slate-600">
          ลูกค้าเห็นเฉพาะ SGF Seeds — ไม่มี Seeds Genetics / hand-carry
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">หัวข้อบนหน้าลูกค้า</Label>
            <Input value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">อายุลิงก์ (วัน)</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={shareDays}
              onChange={(e) => setShareDays(Number(e.target.value) || 14)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showStrains}
            onChange={(e) => setShowStrains(e.target.checked)}
          />
          โชว์รายการสายพันธุ์ (SGF Seeds)
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="bg-[#12463e] hover:bg-[#0f3a34]"
            onClick={() => void mintLink()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-1.5 h-4 w-4" />
            )}
            {mintButtonLabel("gf")}
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/admin/documents/b2b-quote?channel=gf">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              B2B quote (GF)
            </Link>
          </Button>
        </div>
        {link ? (
          <p className="break-all font-mono text-xs text-slate-600">
            <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-700" />
            {link}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
