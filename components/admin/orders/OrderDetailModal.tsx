"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function OrderDetailModal({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0",
          "max-h-[min(92dvh,960px)]",
          "top-[4dvh] translate-x-[-50%] translate-y-0",
          "sm:top-[50%] sm:translate-y-[-50%]"
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function OrderDetailModalHeader({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-b border-zinc-100 bg-background px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6">
      {children}
    </div>
  );
}

export function OrderDetailModalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}
