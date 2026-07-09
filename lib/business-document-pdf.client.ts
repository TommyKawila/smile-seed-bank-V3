"use client";

import { buildBusinessDocumentPrintHtmlFromBody } from "@/lib/business-document-template";

/** Client-only: print via hidden iframe (no pop-up). */
export function exportBusinessDocumentPdf(bodyText: string, logoUrl: string | null): void {
  const html = buildBusinessDocumentPrintHtmlFromBody(bodyText, logoUrl);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Business document print");
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

  const cleanup = () => {
    iframe.remove();
  };

  const doPrint = () => {
    try {
      win.focus();
      win.print();
    } finally {
      if ("onafterprint" in win) {
        win.onafterprint = cleanup;
      }
      setTimeout(cleanup, 30_000);
    }
  };

  if (doc.readyState === "complete") {
    setTimeout(doPrint, 400);
  } else {
    iframe.onload = () => setTimeout(doPrint, 400);
  }
}
