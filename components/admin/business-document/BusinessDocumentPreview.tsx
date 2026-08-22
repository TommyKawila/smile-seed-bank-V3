"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  formatLetterheadBlock,
  formatStoreTrustBlock,
  type LegalDocumentOverrides,
} from "@/lib/company-legal-identity";
import { plainLetterBodyToHtml } from "@/lib/business-document-raw-format";
import {
  attachmentDisplayName,
  isPdfAttachmentUrl,
} from "@/lib/business-document-attachments";

const DOC_BODY_PREVIEW_CLASS =
  "doc-body min-h-[80mm] flex-1 text-[11pt] leading-[1.35] text-slate-700 " +
  "[&_p]:mb-[3.5mm] [&_.doc-subject]:mb-[2mm] [&_.doc-subject]:text-[12pt] [&_.doc-subject]:font-semibold [&_.doc-subject]:text-[#12463e] " +
  "[&_.doc-date]:mb-[4mm] [&_.doc-date]:text-[10pt] [&_.doc-date]:text-slate-500 " +
  "[&_.doc-heading]:mb-[2mm] [&_.doc-heading]:mt-[4mm] [&_.doc-heading]:font-semibold [&_.doc-heading]:text-[#12463e] " +
  "[&_.doc-signoff]:mt-[4mm] [&_.doc-signoff]:font-semibold " +
  "[&_.doc-signature]:mt-[1mm] [&_.doc-table]:my-[3mm] [&_.doc-table]:w-full [&_.doc-table]:border-collapse " +
  "[&_.doc-table_td]:border [&_.doc-table_td]:border-slate-200 [&_.doc-table_td]:p-1.5 [&_.doc-table_td]:align-top " +
  "[&_.doc-table_th]:border [&_.doc-table_th]:border-slate-200 [&_.doc-table_th]:bg-slate-100 [&_.doc-table_th]:p-1.5 " +
  "[&_.doc-table_th]:text-left [&_.doc-table_th]:font-semibold [&_.doc-table_th]:text-[#12463e] " +
  "[&_.doc-list]:my-[2mm] [&_.doc-list]:list-disc [&_.doc-list]:pl-5 [&_.doc-list_li]:mb-[1mm]";

type Props = {
  bodyText: string;
  onBodyChange: (value: string) => void;
  logoUrl: string | null;
  signatureImageUrl?: string | null;
  attachmentImageUrls?: string[];
  companyEmail?: string | null;
  companyPhone?: string | null;
  legalOverrides?: LegalDocumentOverrides;
  includeStoreFooter?: boolean;
  className?: string;
};

export function BusinessDocumentPreview({
  bodyText,
  onBodyChange,
  logoUrl,
  signatureImageUrl,
  attachmentImageUrls = [],
  companyEmail,
  companyPhone,
  legalOverrides,
  includeStoreFooter = true,
  className,
}: Props) {
  const [editSource, setEditSource] = useState(false);
  const letterhead = formatLetterheadBlock("en", legalOverrides);
  const footer = includeStoreFooter
    ? formatStoreTrustBlock("en", legalOverrides)
    : [];
  const brandLine = letterhead[letterhead.length - 1] ?? "";
  const letterheadMiddle = letterhead.slice(1, -1);
  const contactBits = [companyEmail?.trim(), companyPhone?.trim()].filter(Boolean);
  const bodyHtml = plainLetterBodyToHtml(bodyText);

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
            {letterheadMiddle.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="font-medium text-[#12463e]">{brandLine}</p>
            {contactBits.length > 0 ? <p>{contactBits.join(" · ")}</p> : null}
          </div>
        </div>
      </header>

      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Letter preview (PDF / email)
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-slate-500"
          onClick={() => setEditSource((v) => !v)}
        >
          {editSource ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide source
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Edit source
            </>
          )}
        </Button>
      </div>

      {editSource ? (
        <textarea
          value={bodyText}
          onChange={(e) => onBodyChange(e.target.value)}
          spellCheck={false}
          aria-label="Document body source"
          className={cn(
            "mb-4 min-h-[80mm] w-full shrink-0 resize-y rounded-md border border-slate-200 bg-slate-50/80 p-3",
            "font-mono text-[10pt] leading-[1.35] text-slate-700",
            "whitespace-pre-wrap break-words outline-none focus:border-[#12463e]/40 focus:ring-1 focus:ring-[#12463e]/20"
          )}
          placeholder="Paste or edit letter text…"
        />
      ) : null}

      {bodyText.trim() ? (
        <div
          className={DOC_BODY_PREVIEW_CLASS}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : (
        <p className="flex-1 text-[11pt] text-slate-400">
          Paste raw letter → Format → preview appears here.
        </p>
      )}

      {attachmentImageUrls.length > 0 ? (
        <div className="mt-4 space-y-3 shrink-0">
          {attachmentImageUrls.map((url) =>
            isPdfAttachmentUrl(url) ? (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#12463e] hover:bg-slate-100"
              >
                PDF · {attachmentDisplayName(url)}
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Attachment"
                className="max-h-[320px] w-auto max-w-full rounded border border-slate-200 object-contain object-left"
              />
            )
          )}
        </div>
      ) : null}

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

      {footer.length > 0 ? (
        <footer className="mt-6 shrink-0 space-y-0.5 border-t border-slate-200 pt-3 text-[9px] leading-snug text-slate-500">
          {footer.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </footer>
      ) : null}
    </article>
  );
}
