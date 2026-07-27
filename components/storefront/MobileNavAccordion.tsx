"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  active?: boolean;
  menuOpen?: boolean;
  children: ReactNode;
  panelClassName?: string;
};

export function MobileNavAccordion({
  id,
  label,
  active = false,
  menuOpen = true,
  children,
  panelClassName,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) setOpen(false);
  }, [menuOpen]);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-3 py-2.5 text-left"
      >
        <span
          className={cn(
            "text-base font-medium tracking-wide",
            active ? "text-primary" : "text-foreground/85"
          )}
        >
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className={cn("pb-3 pl-1 animate-in fade-in slide-in-from-top-1 duration-150", panelClassName)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
