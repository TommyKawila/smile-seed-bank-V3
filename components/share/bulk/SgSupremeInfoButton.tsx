"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SgSupremeInfoBlock } from "@/lib/seeds-genetics-supreme-copy";
import type { BulkShareLang } from "@/lib/bulk-share-i18n";

type Props = {
  info: SgSupremeInfoBlock;
  label?: string;
  compact?: boolean;
  lang?: BulkShareLang;
};

export function SgSupremeInfoButton({
  info,
  label = "อธิบาย Supreme",
  compact = false,
  lang = "th",
}: Props) {
  const title = lang === "en" ? info.titleEn : info.titleTh;
  const body = lang === "en" ? info.bodyEn : info.bodyTh;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "sm" : "default"}
          className="h-auto gap-1 px-1.5 py-0.5 text-[11px] font-normal text-slate-500 hover:text-slate-800"
        >
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          {body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
