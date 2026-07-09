"use client";

import { FileDown, Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessDocumentFields } from "@/types/business-document";

type Props = {
  fields: BusinessDocumentFields;
  recipientEmail: string;
  onFieldChange: (patch: Partial<BusinessDocumentFields>) => void;
  onRecipientEmailChange: (value: string) => void;
  onApplyFields: () => void;
  onSendEmail: () => void;
  onExportPdf: () => void;
  sending: boolean;
  exporting: boolean;
};

export function BusinessDocumentControls({
  fields,
  recipientEmail,
  onFieldChange,
  onRecipientEmailChange,
  onApplyFields,
  onSendEmail,
  onExportPdf,
  sending,
  exporting,
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Edit fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-recipient" className="text-xs text-slate-600">
              Recipient name
            </Label>
            <Input
              id="doc-recipient"
              value={fields.recipientName}
              onChange={(e) => onFieldChange({ recipientName: e.target.value })}
              placeholder="Green Future Team"
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
              placeholder="Mellow Moon"
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
              placeholder="Your name"
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
          <p className="text-[11px] leading-relaxed text-slate-500">
            Names &amp; date sync to the document as you type. Use Apply to reset the full template.
          </p>
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
            className="w-full bg-[#12463e] hover:bg-[#0f3a34]"
            onClick={onSendEmail}
            disabled={sending || !recipientEmail.trim()}
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
          <p className="text-[11px] leading-relaxed text-slate-500">
            PDF uses your browser print dialog — choose &ldquo;Save as PDF&rdquo; for a clean A4 export.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
