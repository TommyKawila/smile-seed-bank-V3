"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBusinessDocumentDispatch } from "@/hooks/useBusinessDocumentDispatch";
import { useBusinessDocumentDrafts } from "@/hooks/useBusinessDocumentDrafts";
import { useBusinessContacts } from "@/hooks/useBusinessContacts";
import { formatRawBusinessLetter } from "@/lib/business-document-raw-format";
import {
  GREEN_FUTURE_CLARIFICATION_RAW,
  GREEN_FUTURE_CLARIFICATION_SUBJECT,
} from "@/lib/green-future-clarification-letter";
import {
  GREEN_FUTURE_MEETING_PACK_RAW,
  GREEN_FUTURE_MEETING_PACK_SUBJECT,
} from "@/lib/green-future-meeting-pack";
import {
  GREEN_FUTURE_RESPONSE_REPLY_RAW,
  GREEN_FUTURE_RESPONSE_REPLY_SUBJECT,
} from "@/lib/green-future-response-reply-letter";
import {
  GREEN_FUTURE_TEST_ORDER_RAW,
  GREEN_FUTURE_TEST_ORDER_SUBJECT,
} from "@/lib/green-future-test-order";
import { exportBusinessDocumentPdf } from "@/lib/business-document-pdf.client";
import type { LegalDocumentOverrides } from "@/lib/company-legal-identity";
import { resolveCompanyContactEmail } from "@/lib/company-legal-identity";
import {
  DEFAULT_BUSINESS_DOCUMENT_FIELDS,
  FOUNDER_SIGNATURE_SETTING_KEY,
} from "@/types/business-document";
import type {
  BusinessDocumentFields,
  BusinessDocumentRecord,
} from "@/types/business-document";
import type { BusinessContactRecord } from "@/types/business-contact";
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
  const {
    contacts,
    loading: contactsLoading,
    refresh: refreshContacts,
  } = useBusinessContacts();

  const [fields, setFields] = useState<BusinessDocumentFields>(initialFields);
  const [bodyText, setBodyText] = useState("");
  const [subject, setSubject] = useState("");
  const [rawPaste, setRawPaste] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);
  const [attachmentImageUrls, setAttachmentImageUrls] = useState<string[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sigHydrated, setSigHydrated] = useState(false);

  const logoUrl = settings.logo_main_url ?? null;
  const companyEmail = resolveCompanyContactEmail(settings.company_email);
  const companyPhone = settings.company_phone ?? null;
  const legalOverrides: LegalDocumentOverrides = {
    companySeedLicenseNumber: settings.legal_company_seed_license_number,
    companyPartnershipRegistrationNumber: settings.legal_company_business_registration_number,
    storeSeedLicenseNumber: settings.legal_seed_license_number,
    storeCommercialRegistrationNumber: settings.legal_business_registration_number,
  };

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

  const applyFormattedLetter = useCallback(
    (raw: string, subjectFallback?: string) => {
      const formatted = formatRawBusinessLetter(raw, {
        documentDate: fields.documentDate,
        senderName: fields.senderName,
        senderTitle: "Founder",
        recipientName: fields.recipientName,
        companyEmail: companyEmail ?? "",
        companyPhone: companyPhone ?? "",
      });
      setBodyText(formatted.bodyPlain);
      setSubject(formatted.subject.trim() || subjectFallback || "");
    },
    [
      fields.documentDate,
      fields.senderName,
      fields.recipientName,
      companyEmail,
      companyPhone,
    ]
  );

  const handleFormatRaw = useCallback(() => {
    if (!rawPaste.trim()) return;
    applyFormattedLetter(rawPaste);
    toast({
      title: "Formatted",
      description: "Placeholders filled from form fields — review the preview.",
    });
  }, [rawPaste, applyFormattedLetter, toast]);

  const loadTemplate = useCallback(
    (raw: string, subjectFallback: string, title: string, description: string) => {
      setRawPaste(raw);
      applyFormattedLetter(raw, subjectFallback);
      toast({ title, description });
    },
    [applyFormattedLetter, toast]
  );

  const handleLoadGreenFutureReply = useCallback(() => {
    loadTemplate(
      GREEN_FUTURE_RESPONSE_REPLY_RAW,
      GREEN_FUTURE_RESPONSE_REPLY_SUBJECT,
      "GF reply loaded",
      "Main reply — attach Meeting pack + Test order PDFs, then send."
    );
  }, [loadTemplate]);

  const handleLoadGreenFutureMeetingPack = useCallback(() => {
    loadTemplate(
      GREEN_FUTURE_MEETING_PACK_RAW,
      GREEN_FUTURE_MEETING_PACK_SUBJECT,
      "Meeting pack loaded",
      "Export PDF and attach to reply email."
    );
  }, [loadTemplate]);

  const handleLoadGreenFutureTestOrder = useCallback(() => {
    loadTemplate(
      GREEN_FUTURE_TEST_ORDER_RAW,
      GREEN_FUTURE_TEST_ORDER_SUBJECT,
      "Test order loaded",
      "Export PDF and attach to reply email."
    );
  }, [loadTemplate]);

  const handleLoadGreenFutureTemplate = useCallback(() => {
    loadTemplate(
      GREEN_FUTURE_CLARIFICATION_RAW,
      GREEN_FUTURE_CLARIFICATION_SUBJECT,
      "GF clarification loaded",
      "0815 clarification — attach plan PDF + legal docs."
    );
  }, [loadTemplate]);

  const handleSaveDraft = useCallback(async () => {
    const result = await saveDraft({
      id: activeDocumentId,
      ...fields,
      bodyText,
      subject,
      signatureImageUrl,
      attachmentImageUrls,
      recipientEmail,
    });
    if (result.success) {
      setActiveDocumentId(result.document.id);
      toast({ title: "Draft saved", description: "Document stored in history." });
      await refreshContacts();
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
    attachmentImageUrls,
    recipientEmail,
    toast,
    refreshContacts,
  ]);

  const handleLoadDocument = useCallback(
    (doc: BusinessDocumentRecord) => {
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
      setAttachmentImageUrls(doc.attachmentImageUrls ?? []);
      toast({
        title: "Loaded",
        description: doc.status === "SENT" ? "Sent letter loaded." : "Draft loaded.",
      });
    },
    [toast]
  );

  const handleSelectContact = useCallback((c: BusinessContactRecord) => {
    setFields((prev) => ({ ...prev, recipientName: c.name || prev.recipientName }));
    setRecipientEmail(c.email);
  }, []);

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
      attachmentImageUrls,
      recipientEmail,
      documentId: activeDocumentId,
    });
    if (result.success) {
      if (result.documentId) setActiveDocumentId(result.documentId);
      toast({
        title: "Email sent",
        description: `Delivered to ${recipientEmail.trim()}`,
      });
      await refresh();
      await refreshContacts();
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
    attachmentImageUrls,
    recipientEmail,
    activeDocumentId,
    sendEmail,
    refresh,
    refreshContacts,
    toast,
  ]);

  const handleExportPdf = useCallback(() => {
    setExporting(true);
    try {
      exportBusinessDocumentPdf(
        bodyText,
        logoUrl,
        subject,
        signatureImageUrl,
        {
          companyEmail,
          companyPhone,
          legalOverrides,
        },
        attachmentImageUrls
      );
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
  }, [
    bodyText,
    logoUrl,
    subject,
    signatureImageUrl,
    attachmentImageUrls,
    companyEmail,
    companyPhone,
    legalOverrides,
    toast,
  ]);

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
          attachmentImageUrls={attachmentImageUrls}
          companyEmail={companyEmail}
          companyPhone={companyPhone}
          legalOverrides={legalOverrides}
        />
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <BusinessDocumentControls
          subject={subject}
          bodyText={bodyText}
          senderName={fields.senderName}
          recipientName={fields.recipientName}
          recipientEmail={recipientEmail}
          rawPaste={rawPaste}
          signatureImageUrl={signatureImageUrl}
          attachmentImageUrls={attachmentImageUrls}
          documents={documents}
          contacts={contacts}
          historyLoading={historyLoading}
          contactsLoading={contactsLoading}
          savingDraft={savingDraft}
          activeDocumentId={activeDocumentId}
          onSubjectChange={setSubject}
          onSenderNameChange={(v) => setFields((prev) => ({ ...prev, senderName: v }))}
          onRecipientNameChange={(v) => setFields((prev) => ({ ...prev, recipientName: v }))}
          onRecipientEmailChange={setRecipientEmail}
          onRawPasteChange={setRawPaste}
          onFormatRaw={handleFormatRaw}
          onLoadGreenFutureTemplate={handleLoadGreenFutureTemplate}
          onLoadGreenFutureReply={handleLoadGreenFutureReply}
          onLoadGreenFutureMeetingPack={handleLoadGreenFutureMeetingPack}
          onLoadGreenFutureTestOrder={handleLoadGreenFutureTestOrder}
          onSignatureUrlChange={setSignatureImageUrl}
          onAttachmentUrlsChange={setAttachmentImageUrls}
          onPersistSignatureDefault={(url) => updateSetting(FOUNDER_SIGNATURE_SETTING_KEY, url)}
          onClearSignatureDefault={() => updateSetting(FOUNDER_SIGNATURE_SETTING_KEY, "")}
          onSelectContact={handleSelectContact}
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
