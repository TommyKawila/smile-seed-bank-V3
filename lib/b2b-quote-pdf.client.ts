"use client";

import { buildB2BQuotePrintHtml } from "@/lib/b2b-quote-print-html";
import type { B2BQuoteDraft } from "@/types/b2b-quote";

export function exportB2BQuotePdf(
  draft: B2BQuoteDraft,
  quoteNumber: string,
  logoUrl: string | null,
  company?: {
    companyName?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    companyAddress?: string | null;
  }
): void {
  const html = buildB2BQuotePrintHtml(draft, quoteNumber, logoUrl, company);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "B2B quote print");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;
  if (!win || !doc) {
    iframe.remove();
    throw new Error("Could not prepare print frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => iframe.remove();
  const doPrint = () => {
    try {
      win.focus();
      win.print();
    } finally {
      if ("onafterprint" in win) win.onafterprint = cleanup;
      setTimeout(cleanup, 30_000);
    }
  };

  if (doc.readyState === "complete") setTimeout(doPrint, 400);
  else iframe.onload = () => setTimeout(doPrint, 400);
}
