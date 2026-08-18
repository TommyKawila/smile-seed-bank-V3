"use client";

import { useMemo, useRef, useState } from "react";
import {
  FileDown,
  FileText,
  Loader2,
  Mail,
  Save,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FOUNDER_SIGNATURE_SETTING_KEY } from "@/types/business-document";
import {
  attachmentDisplayName,
  isPdfAttachmentUrl,
} from "@/lib/business-document-attachments";
import type { BusinessDocumentRecord } from "@/types/business-document";
import type { BusinessContactRecord } from "@/types/business-contact";

type Props = {
  subject: string;
  bodyText: string;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  rawPaste: string;
  signatureImageUrl: string | null;
  attachmentImageUrls: string[];
  documents: BusinessDocumentRecord[];
  contacts: BusinessContactRecord[];
  historyLoading: boolean;
  contactsLoading: boolean;
  savingDraft: boolean;
  activeDocumentId: string | null;
  onSubjectChange: (value: string) => void;
  onSenderNameChange: (value: string) => void;
  onRecipientNameChange: (value: string) => void;
  onRecipientEmailChange: (value: string) => void;
  onRawPasteChange: (value: string) => void;
  onFormatRaw: () => void;
  onSignatureUrlChange: (url: string | null) => void;
  onAttachmentUrlsChange: (urls: string[]) => void;
  onPersistSignatureDefault: (url: string) => Promise<void>;
  onClearSignatureDefault: () => Promise<void>;
  onSelectContact: (contact: BusinessContactRecord) => void;
  onSaveDraft: () => void;
  onLoadDocument: (doc: BusinessDocumentRecord) => void;
  onDeleteDocument: (id: string) => void;
  onSendEmail: () => void;
  onExportPdf: () => void;
  sending: boolean;
  exporting: boolean;
};

const MAX_ATTACHMENTS = 8;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

export function BusinessDocumentControls({
  subject,
  bodyText,
  senderName,
  recipientName,
  recipientEmail,
  rawPaste,
  signatureImageUrl,
  attachmentImageUrls,
  documents,
  contacts,
  historyLoading,
  contactsLoading,
  savingDraft,
  activeDocumentId,
  onSubjectChange,
  onSenderNameChange,
  onRecipientNameChange,
  onRecipientEmailChange,
  onRawPasteChange,
  onFormatRaw,
  onSignatureUrlChange,
  onAttachmentUrlsChange,
  onPersistSignatureDefault,
  onClearSignatureDefault,
  onSelectContact,
  onSaveDraft,
  onLoadDocument,
  onDeleteDocument,
  onSendEmail,
  onExportPdf,
  sending,
  exporting,
}: Props) {
  const sigInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [historyTab, setHistoryTab] = useState<"DRAFT" | "SENT">("SENT");

  const drafts = useMemo(
    () => documents.filter((d) => d.status === "DRAFT"),
    [documents]
  );
  const sent = useMemo(
    () => documents.filter((d) => d.status === "SENT"),
    [documents]
  );
  const historyList = historyTab === "DRAFT" ? drafts : sent;

  const handleSignatureUpload = async (file: File) => {
    setUploadingSig(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", FOUNDER_SIGNATURE_SETTING_KEY);
      const res = await fetch("/api/admin/settings/upload?preset=logo", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      onSignatureUrlChange(json.url);
      await onPersistSignatureDefault(json.url);
    } finally {
      setUploadingSig(false);
    }
  };

  const handleAttachmentUpload = async (files: FileList | File[]) => {
    const remaining = MAX_ATTACHMENTS - attachmentImageUrls.length;
    if (remaining <= 0) return;
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return;
    setUploadingAttach(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        const isPdf =
          file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf && file.size > MAX_PDF_BYTES) {
          throw new Error(`PDF ต้องไม่เกิน ${Math.round(MAX_PDF_BYTES / (1024 * 1024))} MB`);
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", `biz-doc-attach-${Date.now()}`);
        const endpoint = isPdf
          ? "/api/admin/settings/upload"
          : "/api/admin/settings/upload?preset=product";
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
        uploaded.push(json.url);
      }
      onAttachmentUrlsChange([...attachmentImageUrls, ...uploaded]);
    } finally {
      setUploadingAttach(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Paste raw letter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-raw" className="text-xs text-slate-600">
              Raw text
            </Label>
            <Textarea
              id="doc-raw"
              value={rawPaste}
              onChange={(e) => onRawPasteChange(e.target.value)}
              placeholder="Paste Subject: … Dear … — use markdown | tables | for tables"
              rows={8}
              className="min-h-[140px] resize-y border-slate-200 bg-white text-sm"
            />
          </div>
          <Button
            type="button"
            className="w-full bg-[#12463e] hover:bg-[#0f3a34]"
            onClick={onFormatRaw}
            disabled={!rawPaste.trim()}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            จัดรูปแบบจดหมาย
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-sender" className="text-xs text-slate-600">
              Sender name
            </Label>
            <Input
              id="doc-sender"
              value={senderName}
              onChange={(e) => onSenderNameChange(e.target.value)}
              placeholder="Your name"
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <div
            className="relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50"
            onClick={() => sigInputRef.current?.click()}
          >
            {signatureImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureImageUrl}
                alt="Signature"
                className="max-h-20 w-auto object-contain p-2"
              />
            ) : (
              <span className="text-xs text-slate-400">Click to upload PNG/WebP</span>
            )}
            {uploadingSig && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-5 w-5 animate-spin text-[#12463e]" />
              </div>
            )}
          </div>
          <input
            ref={sigInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleSignatureUpload(f);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => sigInputRef.current?.click()}
              disabled={uploadingSig}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-slate-500"
              disabled={!signatureImageUrl}
              onClick={() => {
                onSignatureUrlChange(null);
                void onClearSignatureDefault();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-slate-500">
            Images show in preview/PDF; PDFs attach to email and appear as links (max{" "}
            {MAX_ATTACHMENTS}).
          </p>
          {attachmentImageUrls.length > 0 ? (
            <ul className="space-y-2">
              {attachmentImageUrls.map((url) => (
                <li
                  key={url}
                  className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 p-1.5"
                >
                  {isPdfAttachmentUrl(url) ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">
                      <FileText className="h-5 w-5" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  )}
                  <p className="min-w-0 flex-1 truncate text-[10px] text-slate-500">
                    {attachmentDisplayName(url)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-slate-400 hover:text-red-600"
                    onClick={() =>
                      onAttachmentUrlsChange(
                        attachmentImageUrls.filter((u) => u !== url)
                      )
                    }
                    aria-label="Remove attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            ref={attachInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) void handleAttachmentUpload(files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={
              uploadingAttach || attachmentImageUrls.length >= MAX_ATTACHMENTS
            }
            onClick={() => attachInputRef.current?.click()}
          >
            {uploadingAttach ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload files
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Dispatch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-subject" className="text-xs text-slate-600">
              Subject
            </Label>
            <Input
              id="doc-subject"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Email subject"
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-recipient-name" className="text-xs text-slate-600">
              Recipient name
            </Label>
            <Input
              id="doc-recipient-name"
              value={recipientName}
              onChange={(e) => onRecipientNameChange(e.target.value)}
              placeholder="Partner name"
              className="h-9 border-slate-200 bg-white"
              list="biz-contact-names"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-email" className="text-xs text-slate-600">
              Recipient email
            </Label>
            <Input
              id="doc-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              placeholder="partner@example.com"
              className="h-9 border-slate-200 bg-white"
              list="biz-contact-emails"
            />
            <datalist id="biz-contact-emails">
              {contacts.map((c) => (
                <option key={c.id} value={c.email}>
                  {c.name}
                </option>
              ))}
            </datalist>
            <datalist id="biz-contact-names">
              {contacts.map((c) => (
                <option key={`n-${c.id}`} value={c.name} />
              ))}
            </datalist>
          </div>
          <p className="text-[11px] text-slate-500">
            Sends from Gmail when <code className="text-[10px]">B2B_GMAIL_APP_PASSWORD</code> is
            set; otherwise Resend + Reply-To Gmail.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onSaveDraft}
            disabled={savingDraft || !subject.trim() || !bodyText.trim()}
          >
            {savingDraft ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button
            type="button"
            className="w-full bg-[#12463e] hover:bg-[#0f3a34]"
            onClick={onSendEmail}
            disabled={sending || !recipientEmail.trim() || !subject.trim()}
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send email
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={onExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Save as PDF
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contactsLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-xs text-slate-500">
              Saved when you draft or send — name + email for business records.
            </p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="min-h-12 w-full rounded-md border border-slate-100 bg-white px-2 py-1.5 text-left hover:bg-slate-50"
                    onClick={() => onSelectContact(c)}
                  >
                    <p className="text-xs font-medium text-slate-800">
                      {c.name || c.email}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {c.email}
                      {c.lastSubject ? ` · ${c.lastSubject}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              className={`min-h-10 flex-1 rounded-md text-xs font-medium ${
                historyTab === "SENT"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
              onClick={() => setHistoryTab("SENT")}
            >
              Sent ({sent.length})
            </button>
            <button
              type="button"
              className={`min-h-10 flex-1 rounded-md text-xs font-medium ${
                historyTab === "DRAFT"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
              onClick={() => setHistoryTab("DRAFT")}
            >
              Drafts ({drafts.length})
            </button>
          </div>
          {historyLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : historyList.length === 0 ? (
            <p className="text-xs text-slate-500">
              {historyTab === "SENT" ? "No sent letters yet." : "No drafts yet."}
            </p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {historyList.map((doc) => (
                <li
                  key={doc.id}
                  className={`flex items-start gap-1 rounded-md border px-2 py-1.5 ${
                    activeDocumentId === doc.id
                      ? "border-[#12463e]/40 bg-[#12463e]/5"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    className="min-h-12 flex-1 text-left"
                    onClick={() => onLoadDocument(doc)}
                  >
                    <p className="line-clamp-2 text-xs font-medium text-slate-800">
                      {doc.subject}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {doc.recipientName || "—"} · {doc.recipientEmail || "no email"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {doc.status === "SENT" && doc.sentAt
                        ? `Sent ${new Date(doc.sentAt).toLocaleString("th-TH")}`
                        : `Updated ${new Date(doc.updatedAt).toLocaleString("th-TH")}`}
                    </p>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 text-slate-400 hover:text-red-600"
                    onClick={() => onDeleteDocument(doc.id)}
                    aria-label="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
