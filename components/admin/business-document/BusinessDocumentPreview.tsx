"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  bodyText: string;
  onBodyChange: (value: string) => void;
  logoUrl: string | null;
  className?: string;
};

export function BusinessDocumentPreview({ bodyText, onBodyChange, logoUrl, className }: Props) {
  return (
    <article
      className={cn(
        "mx-auto flex w-full max-w-[210mm] flex-col bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80",
        "min-h-[297mm] px-[20mm] py-[18mm] print:shadow-none print:ring-0",
        className
      )}
      aria-label="Document preview"
    >
      <header className="mb-8 shrink-0 border-b border-slate-200 pb-6">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Smile Seed Bank"
            width={220}
            height={56}
            className="h-12 w-auto max-w-[200px] object-contain object-left"
            unoptimized
          />
        ) : (
          <p className="text-lg font-semibold tracking-wide text-[#12463e]">Smile Seed Bank</p>
        )}
      </header>

      <textarea
        value={bodyText}
        onChange={(e) => onBodyChange(e.target.value)}
        spellCheck={false}
        aria-label="Document body — spaces and line breaks are preserved"
        className={cn(
          "min-h-[220mm] w-full flex-1 resize-y border-0 bg-transparent p-0",
          "font-[inherit] text-[11pt] leading-[1.22] text-slate-700",
          "whitespace-pre-wrap break-words outline-none",
          "focus:ring-0 placeholder:text-slate-400",
          "selection:bg-[#12463e]/15"
        )}
        placeholder="Type your letter here…"
      />

      <p className="mt-3 shrink-0 text-[10px] text-slate-400 lg:hidden">
        Tap inside the document — Space &amp; Enter keep your layout.
      </p>
    </article>
  );
}
