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

type Props = {
  info: SgSupremeInfoBlock;
  label?: string;
  compact?: boolean;
};

export function SgSupremeInfoButton({ info, label = "อธิบาย Supreme", compact = false }: Props) {
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
          <DialogTitle className="text-base leading-snug">{info.titleEn}</DialogTitle>
          <p className="text-sm font-medium text-slate-600">{info.titleTh}</p>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          {info.bodyEn.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <div className="border-t border-slate-100 pt-3 text-slate-600">
            {info.bodyTh.map((p) => (
              <p key={p.slice(0, 24)} className="mt-2 first:mt-0">
                {p}
              </p>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
