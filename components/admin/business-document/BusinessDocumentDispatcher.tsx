"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBusinessDocumentDispatch } from "@/hooks/useBusinessDocumentDispatch";
import { exportBusinessDocumentPdf } from "@/lib/business-document-pdf.client";
import { buildBusinessDocumentPlainText, syncFieldsInBodyText } from "@/lib/business-document-template";
import { DEFAULT_BUSINESS_DOCUMENT_FIELDS } from "@/types/business-document";
import type { BusinessDocumentFields } from "@/types/business-document";
import { BusinessDocumentPreview } from "./BusinessDocumentPreview";
import { BusinessDocumentControls } from "./BusinessDocumentControls";

function initialFields(): BusinessDocumentFields {
  return {
    ...DEFAULT_BUSINESS_DOCUMENT_FIELDS,
    documentDate: new Date().toISOString().slice(0, 10),
  };
}

export function BusinessDocumentDispatcher() {
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const { sendEmail, sending } = useBusinessDocumentDispatch();
  const [fields, setFields] = useState<BusinessDocumentFields>(initialFields);
  const [bodyText, setBodyText] = useState(() => buildBusinessDocumentPlainText(initialFields()));
  const [recipientEmail, setRecipientEmail] = useState("");
  const [exporting, setExporting] = useState(false);

  const logoUrl = settings.logo_main_url ?? null;

  const patchFields = useCallback((patch: Partial<BusinessDocumentFields>) => {
    setFields((prev) => {
      const next = { ...prev, ...patch };
      setBodyText((body) => syncFieldsInBodyText(body, prev, next));
      return next;
    });
  }, []);

  const applyFieldsToDocument = useCallback(() => {
    setBodyText(buildBusinessDocumentPlainText(fields));
    toast({ title: "Applied", description: "Fields merged into document text." });
  }, [fields, toast]);

  const handleSendEmail = useCallback(async () => {
    const result = await sendEmail({ ...fields, bodyText, recipientEmail });
    if (result.success) {
      toast({ title: "Email sent", description: `Delivered to ${recipientEmail.trim()}` });
    } else {
      toast({
        title: "Send failed",
        description: result.error ?? "Could not send email",
        variant: "destructive",
      });
    }
  }, [fields, bodyText, recipientEmail, sendEmail, toast]);

  const handleExportPdf = useCallback(() => {
    setExporting(true);
    try {
      exportBusinessDocumentPdf(bodyText, logoUrl);
      toast({
        title: "Print dialog opened",
        description: 'Select "Save as PDF" in the print dialog.',
      });
    } catch (err) {
      toast({
        title: "PDF export failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setExporting(false), 400);
    }
  }, [bodyText, logoUrl, toast]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-2 rounded-xl bg-slate-100/80 p-4 sm:p-6 lg:p-8">
        <p className="hidden text-xs text-slate-500 lg:block">
          คลิกในเอกสารแล้วพิมพ์ — กด Space หรือ Enter เพื่อเว้นบรรทัด / จัดหน้าได้ตามต้องการ
        </p>
        <BusinessDocumentPreview
          bodyText={bodyText}
          onBodyChange={setBodyText}
          logoUrl={logoUrl}
        />
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <BusinessDocumentControls
          fields={fields}
          recipientEmail={recipientEmail}
          onFieldChange={patchFields}
          onRecipientEmailChange={setRecipientEmail}
          onApplyFields={applyFieldsToDocument}
          onSendEmail={() => void handleSendEmail()}
          onExportPdf={handleExportPdf}
          sending={sending}
          exporting={exporting}
        />
      </aside>
    </div>
  );
}
