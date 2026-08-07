"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatLetterheadBlock, formatStoreTrustBlock } from "@/lib/company-legal-identity";

type Props = {
  bodyText: string;
  onBodyChange: (value: string) => void;
  logoUrl: string | null;
  signatureImageUrl?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  className?: string;
};

export function BusinessDocumentPreview({
  bodyText,
  onBodyChange,
  logoUrl,
  signatureImageUrl,
  companyEmail,
  companyPhone,
  className,
}: Props) {
  const letterhead = formatLetterheadBlock("en");
  const footer = formatStoreTrustBlock("en");
  const contactBits = [companyEmail?.trim(), companyPhone?.trim()].filter(Boolean);

  return (
    <article
      className={cn(
        "mx-auto flex w-full max-w-[210mm] flex-col bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80",
        "min-h-[297mm] px-[20mm] py-[18mm] print:shadow-none print:ring-0",
        className
      )}
      aria-label="Document preview"
    >
      <header className="mb-6 shrink-0 border-b-[1.5px] border-[#12463e] pb-5">
        <div className="flex gap-4 sm:gap-6">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Smile Seed Bank"
              width={180}
              height={48}
              className="h-11 w-auto max-w-[160px] shrink-0 object-contain object-left"
              unoptimized
            />
          ) : (
            <p className="shrink-0 text-base font-semibold tracking-wide text-[#12463e]">
              Smile Seed Bank
            </p>
          )}
          <div className="min-w-0 flex-1 space-y-0.5 text-[10px] leading-snug text-slate-600 sm:text-[11px]">
            <p className="font-semibold text-[#12463e]">{letterhead[0]}</p>
            <p>{letterhead[1]}</p>
            <p>{letterhead[2]}</p>
            <p className="font-medium text-[#12463e]">{letterhead[3]}</p>
            {contactBits.length > 0 ? <p>{contactBits.join(" · ")}</p> : null}
          </div>
        </div>
      </header>

      <textarea
        value={bodyText}
        onChange={(e) => onBodyChange(e.target.value)}
        spellCheck={false}
        aria-label="Document body — spaces and line breaks are preserved"
        className={cn(
          "min-h-[180mm] w-full flex-1 resize-y border-0 bg-transparent p-0",
          "font-[inherit] text-[11pt] leading-[1.22] text-slate-700",
          "whitespace-pre-wrap break-words outline-none",
          "focus:ring-0 placeholder:text-slate-400",
          "selection:bg-[#12463e]/15"
        )}
        placeholder="Type your letter here…"
      />

      {signatureImageUrl ? (
        <div className="mt-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureImageUrl}
            alt="Signature"
            className="h-[72px] w-auto max-w-[200px] object-contain object-left"
          />
        </div>
      ) : null}

      <footer className="mt-6 shrink-0 space-y-0.5 border-t border-slate-200 pt-3 text-[9px] leading-snug text-slate-500">
        {footer.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </footer>

      <p className="mt-3 shrink-0 text-[10px] text-slate-400 lg:hidden">
        Tap inside the document — Space &amp; Enter keep your layout.
      </p>
    </article>
  );
}
