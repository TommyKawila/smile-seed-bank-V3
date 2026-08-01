"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBusinessDocumentDispatch } from "@/hooks/useBusinessDocumentDispatch";
import { useBusinessDocumentDrafts } from "@/hooks/useBusinessDocumentDrafts";
import { formatRawBusinessLetter } from "@/lib/business-document-raw-format";
import { exportBusinessDocumentPdf } from "@/lib/business-document-pdf.client";
import { buildBusinessDocumentPlainText, syncFieldsInBodyText } from "@/lib/business-document-template";
import {
  BUSINESS_DOCUMENT_SUBJECT,
  DEFAULT_BUSINESS_DOCUMENT_FIELDS,
  FOUNDER_SIGNATURE_SETTING_KEY,
} from "@/types/business-document";
import type {
  BusinessDocumentFields,
  BusinessDocumentRecord,
} from "@/types/business-document";
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
  const { settings, updateSetting } = useSiteSettings();
  const { sendEmail, sending } = useBusinessDocumentDispatch();
  const {
    documents,
    loading: historyLoading,
    saving: savingDraft,
    saveDraft,
    remove,
    refresh,
  } = useBusinessDocumentDrafts();

  const [fields, setFields] = useState<BusinessDocumentFields>(initialFields);
  const [bodyText, setBodyText] = useState(() => buildBusinessDocumentPlainText(initialFields()));
  const [subject, setSubject] = useState(BUSINESS_DOCUMENT_SUBJECT);
  const [rawPaste, setRawPaste] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sigHydrated, setSigHydrated] = useState(false);

  const logoUrl = settings.logo_main_url ?? null;

  useEffect(() => {
    if (sigHydrated) return;
    const fromSettings = settings.founder_signature_url?.trim();
    if (fromSettings) {
      setSignatureImageUrl(fromSettings);
      setSigHydrated(true);
    } else if (!historyLoading) {
      setSigHydrated(true);
    }
  }, [settings, sigHydrated, historyLoading]);

  const patchFields = useCallback((patch: Partial<BusinessDocumentFields>) => {
    setFields((prev) => {
      const next = { ...prev, ...patch };
      setBodyText((body) => syncFieldsInBodyText(body, prev, next));
      return next;
    });
  }, []);

  const applyFieldsToDocument = useCallback(() => {
    setBodyText(buildBusinessDocumentPlainText(fields));
    setSubject(BUSINESS_DOCUMENT_SUBJECT);
    toast({ title: "Applied", description: "Fields merged into document text." });
  }, [fields, toast]);

  const handleFormatRaw = useCallback(() => {
    if (!rawPaste.trim()) return;
    const formatted = formatRawBusinessLetter(rawPaste, {
      documentDate: fields.documentDate,
      senderName: fields.senderName,
    });
    setBodyText(formatted.bodyPlain);
    setSubject(formatted.subject);
    toast({ title: "Formatted", description: "Letter layout applied — review the preview." });
  }, [rawPaste, fields.documentDate, fields.senderName, toast]);

  const handleSaveDraft = useCallback(async () => {
    const result = await saveDraft({
      id: activeDocumentId,
      ...fields,
      bodyText,
      subject,
      signatureImageUrl,
      recipientEmail,
    });
    if (result.success) {
      setActiveDocumentId(result.document.id);
      toast({ title: "Draft saved", description: "Document stored in history." });
    } else {
      toast({
        title: "Save failed",
        description: result.error,
        variant: "destructive",
      });
    }
  }, [
    saveDraft,
    activeDocumentId,
    fields,
    bodyText,
    subject,
    signatureImageUrl,
    recipientEmail,
    toast,
  ]);

  const handleLoadDocument = useCallback((doc: BusinessDocumentRecord) => {
    setActiveDocumentId(doc.id);
    setFields({
      recipientName: doc.recipientName,
      brandName: doc.brandName,
      senderName: doc.senderName,
      documentDate: doc.documentDate,
    });
    setBodyText(doc.bodyText);
    setSubject(doc.subject);
    setRecipientEmail(doc.recipientEmail);
    setSignatureImageUrl(doc.signatureImageUrl);
    toast({ title: "Loaded", description: doc.status === "SENT" ? "Sent letter loaded." : "Draft loaded." });
  }, [toast]);

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        if (activeDocumentId === id) setActiveDocumentId(null);
        toast({ title: "Deleted", description: "Document removed from history." });
      } catch (err) {
        toast({
          title: "Delete failed",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    },
    [remove, activeDocumentId, toast]
  );

  const handleSendEmail = useCallback(async () => {
    const result = await sendEmail({
      ...fields,
      bodyText,
      subject,
      signatureImageUrl,
      recipientEmail,
      documentId: activeDocumentId,
    });
    if (result.success) {
      if (result.documentId) setActiveDocumentId(result.documentId);
      toast({ title: "Email sent", description: `Delivered to ${recipientEmail.trim()}` });
      await refresh();
    } else {
      toast({
        title: "Send failed",
        description: result.error ?? "Could not send email",
        variant: "destructive",
      });
    }
  }, [
    fields,
    bodyText,
    subject,
    signatureImageUrl,
    recipientEmail,
    activeDocumentId,
    sendEmail,
    refresh,
    toast,
  ]);

  const handleExportPdf = useCallback(() => {
    setExporting(true);
    try {
      exportBusinessDocumentPdf(bodyText, logoUrl, subject, signatureImageUrl);
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
  }, [bodyText, logoUrl, subject, signatureImageUrl, toast]);

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
          signatureImageUrl={signatureImageUrl}
        />
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <BusinessDocumentControls
          fields={fields}
          subject={subject}
          bodyText={bodyText}
          recipientEmail={recipientEmail}
          rawPaste={rawPaste}
          signatureImageUrl={signatureImageUrl}
          documents={documents}
          historyLoading={historyLoading}
          savingDraft={savingDraft}
          activeDocumentId={activeDocumentId}
          onFieldChange={patchFields}
          onSubjectChange={setSubject}
          onRecipientEmailChange={setRecipientEmail}
          onRawPasteChange={setRawPaste}
          onFormatRaw={handleFormatRaw}
          onApplyFields={applyFieldsToDocument}
          onSignatureUrlChange={setSignatureImageUrl}
          onPersistSignatureDefault={(url) => updateSetting(FOUNDER_SIGNATURE_SETTING_KEY, url)}
          onClearSignatureDefault={() => updateSetting(FOUNDER_SIGNATURE_SETTING_KEY, "")}
          onSaveDraft={() => void handleSaveDraft()}
          onLoadDocument={handleLoadDocument}
          onDeleteDocument={(id) => void handleDeleteDocument(id)}
          onSendEmail={() => void handleSendEmail()}
          onExportPdf={handleExportPdf}
          sending={sending}
          exporting={exporting}
        />
      </aside>
    </div>
  );
}
