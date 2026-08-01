"use client";

import { useRef, useState } from "react";
import {
  FileDown,
  Loader2,
  Mail,
  RefreshCw,
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
import type { BusinessDocumentFields, BusinessDocumentRecord } from "@/types/business-document";

type Props = {
  fields: BusinessDocumentFields;
  subject: string;
  bodyText: string;
  recipientEmail: string;
  rawPaste: string;
  signatureImageUrl: string | null;
  documents: BusinessDocumentRecord[];
  historyLoading: boolean;
  savingDraft: boolean;
  activeDocumentId: string | null;
  onFieldChange: (patch: Partial<BusinessDocumentFields>) => void;
  onSubjectChange: (value: string) => void;
  onRecipientEmailChange: (value: string) => void;
  onRawPasteChange: (value: string) => void;
  onFormatRaw: () => void;
  onApplyFields: () => void;
  onSignatureUrlChange: (url: string | null) => void;
  onPersistSignatureDefault: (url: string) => Promise<void>;
  onClearSignatureDefault: () => Promise<void>;
  onSaveDraft: () => void;
  onLoadDocument: (doc: BusinessDocumentRecord) => void;
  onDeleteDocument: (id: string) => void;
  onSendEmail: () => void;
  onExportPdf: () => void;
  sending: boolean;
  exporting: boolean;
};

export function BusinessDocumentControls({
  fields,
  subject,
  bodyText,
  recipientEmail,
  rawPaste,
  signatureImageUrl,
  documents,
  historyLoading,
  savingDraft,
  activeDocumentId,
  onFieldChange,
  onSubjectChange,
  onRecipientEmailChange,
  onRawPasteChange,
  onFormatRaw,
  onApplyFields,
  onSignatureUrlChange,
  onPersistSignatureDefault,
  onClearSignatureDefault,
  onSaveDraft,
  onLoadDocument,
  onDeleteDocument,
  onSendEmail,
  onExportPdf,
  sending,
  exporting,
}: Props) {
  const sigInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSig, setUploadingSig] = useState(false);

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
              placeholder="Paste Subject: … Dear … Best regards …"
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
            Signature image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <CardTitle className="text-base font-semibold text-slate-800">Edit fields</CardTitle>
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
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-recipient" className="text-xs text-slate-600">
              Recipient name
            </Label>
            <Input
              id="doc-recipient"
              value={fields.recipientName}
              onChange={(e) => onFieldChange({ recipientName: e.target.value })}
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-brand" className="text-xs text-slate-600">
              Brand name
            </Label>
            <Input
              id="doc-brand"
              value={fields.brandName}
              onChange={(e) => onFieldChange({ brandName: e.target.value })}
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-sender" className="text-xs text-slate-600">
              Sender name
            </Label>
            <Input
              id="doc-sender"
              value={fields.senderName}
              onChange={(e) => onFieldChange({ senderName: e.target.value })}
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-date" className="text-xs text-slate-600">
              Date
            </Label>
            <Input
              id="doc-date"
              type="date"
              value={fields.documentDate}
              onChange={(e) => onFieldChange({ documentDate: e.target.value })}
              className="h-9 border-slate-200 bg-white"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            onClick={onApplyFields}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Apply fields to document
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Dispatch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-email" className="text-xs text-slate-600">
              Recipient email
            </Label>
            <Input
              id="doc-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              placeholder="partner@greenfuture.example"
              className="h-9 border-slate-200 bg-white"
            />
          </div>
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
            History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {historyLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-slate-500">No saved documents yet.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {documents.map((doc) => (
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
                      {doc.status} · {new Date(doc.updatedAt).toLocaleString("th-TH")}
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
