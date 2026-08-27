"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatRawBusinessLetter,
  plainLetterBodyToHtml,
} from "@/lib/business-document-raw-format";

const DOC_BODY_CLASS =
  "doc-body text-[11pt] leading-[1.45] text-slate-700 " +
  "[&_p]:mb-[3.5mm] [&_.doc-subject]:mb-[2mm] [&_.doc-subject]:text-[12pt] [&_.doc-subject]:font-semibold [&_.doc-subject]:text-[#12463e] " +
  "[&_.doc-date]:mb-[4mm] [&_.doc-date]:text-[10pt] [&_.doc-date]:text-slate-500 " +
  "[&_.doc-heading]:mb-[2mm] [&_.doc-heading]:mt-[4mm] [&_.doc-heading]:font-semibold [&_.doc-heading]:text-[#12463e] " +
  "[&_.doc-signoff]:mt-[4mm] [&_.doc-signoff]:font-semibold " +
  "[&_.doc-table]:my-[3mm] [&_.doc-table]:w-full [&_.doc-table]:border-collapse " +
  "[&_.doc-table_td]:border [&_.doc-table_td]:border-slate-200 [&_.doc-table_td]:p-1.5 [&_.doc-table_td]:align-top " +
  "[&_.doc-table_th]:border [&_.doc-table_th]:border-slate-200 [&_.doc-table_th]:bg-slate-100 [&_.doc-table_th]:p-1.5 " +
  "[&_.doc-table_th]:text-left [&_.doc-table_th]:font-semibold [&_.doc-table_th]:text-[#12463e] " +
  "[&_.doc-list]:my-[2mm] [&_.doc-list]:list-disc [&_.doc-list]:pl-5 [&_.doc-list_li]:mb-[1mm]";

type Props = {
  title: string;
  description: string;
  raw: string;
  internal?: boolean;
  lang?: "th" | "en";
};

export function GreenFutureLetterView({
  title,
  description,
  raw,
  internal = false,
  lang = "th",
}: Props) {
  const bodyHtml = useMemo(() => {
    const formatted = formatRawBusinessLetter(raw, {
      documentDate: new Date().toISOString().slice(0, 10),
      senderTitle: "Founder",
    });
    return plainLetterBodyToHtml(formatted.bodyPlain);
  }, [raw]);

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #gf-letter-print, #gf-letter-print * {
            visibility: visible !important;
          }
          #gf-letter-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {internal ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Internal
              </span>
            ) : null}
          </div>
          <p className="max-w-2xl text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            Save as PDF
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/admin/documents/dispatcher">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Dispatcher
            </Link>
          </Button>
        </div>
      </div>
      <div
        id="gf-letter-print"
        className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8"
        lang={lang}
      >
        <div
          className={DOC_BODY_CLASS}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>
    </div>
  );
}
