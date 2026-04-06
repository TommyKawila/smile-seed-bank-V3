"use client";

import { useEffect, useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AffiliateLinkRow = {
  id: number;
  title: string;
  url: string;
  platform_name: string;
  image_url: string | null;
};

/** Insert a placeholder affiliate line into TipTap JSON (paragraph). */
export function appendAffiliateBlock(
  doc: object | null,
  link: AffiliateLinkRow
): object {
  const line = `[AFFILIATE:${link.id}]`;
  const base =
    doc &&
    typeof doc === "object" &&
    "type" in doc &&
    (doc as { type?: string }).type === "doc"
      ? (doc as { type: "doc"; content?: object[] })
      : { type: "doc" as const, content: [] as object[] };
  const content = [...(base.content ?? [])];
  content.push({
    type: "paragraph",
    content: [{ type: "text", text: line }],
  });
  return { type: "doc", content };
}

export function AffiliateEmbedPicker({
  onPick,
}: {
  onPick: (link: AffiliateLinkRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<AffiliateLinkRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/affiliate-links")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setList(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 border-zinc-200">
          <Link2 className="h-3.5 w-3.5" />
          Affiliate link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-zinc-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Affiliate links</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No links yet — add via POST /api/admin/affiliate-links or seed DB.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {list.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent px-3 py-2 text-left text-sm transition hover:border-zinc-200 hover:bg-zinc-50"
                  onClick={() => {
                    onPick(row);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-zinc-900">{row.title}</span>
                  <span className="ml-2 text-xs text-zinc-500">{row.platform_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
