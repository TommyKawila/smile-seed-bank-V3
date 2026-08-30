"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sampleUrl: string | null;
  packageKey: "A" | "B";
};

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url) || /\/api\/wholesale\/lot-test-sample/i.test(url);
}

export function CoaSamplePreviewModal({
  open,
  onOpenChange,
  title,
  sampleUrl,
  packageKey,
}: Props) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 text-slate-900 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-xl"
          )}
        >
          <DialogHeader>
            <DialogTitle className="pr-8 text-left text-base font-semibold text-slate-900 sm:text-lg">
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {sampleUrl ? (
              isPdfUrl(sampleUrl) ? (
                <iframe
                  title={title}
                  src={sampleUrl}
                  className="h-[min(60vh,480px)] w-full bg-white"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- sample URL from supplier
                <img
                  src={sampleUrl}
                  alt={`COA Package ${packageKey} sample`}
                  className="max-h-[min(60vh,480px)] w-full object-contain"
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <Loader2
                  className="h-8 w-8 animate-spin text-emerald-600"
                  aria-hidden
                />
                <p className="text-sm text-slate-600">
                  {t(
                    "กำลังโหลดเอกสารตัวอย่าง…",
                    "Sample document loading…"
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {t(
                    `Package ${packageKey} · รอไฟล์ตัวอย่างจาก supplier`,
                    `Package ${packageKey} · placeholder until supplier file is linked`
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              {t("ปิดหน้าต่าง", "Close")}
            </button>
          </DialogFooter>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-slate-500 opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
