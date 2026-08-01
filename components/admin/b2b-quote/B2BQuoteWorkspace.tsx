"use client";

import { useCallback, useMemo, useState } from "react";
import { FileDown, Loader2, Mail, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useB2BQuoteDrafts } from "@/hooks/useB2BQuoteDrafts";
import { useB2BQuoteDispatch } from "@/hooks/useB2BQuoteDispatch";
import { exportB2BQuotePdf } from "@/lib/b2b-quote-pdf.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createMalikhaOptionA,
  createMalikhaOptionB,
  defaultValidUntil,
  emptyB2BLineItem,
  type B2BQuoteDraft,
  type B2BQuoteRecord,
} from "@/types/b2b-quote";
import { B2BQuoteForm } from "./B2BQuoteForm";
import { ProFormaInvoiceTemplate } from "./ProFormaInvoiceTemplate";

function initialDraft(): B2BQuoteDraft {
  const invoiceDate = new Date().toISOString().slice(0, 10);
  return {
    clientName: "",
    clientEmail: "",
    shippingAddress: "",
    invoiceDate,
    validUntil: defaultValidUntil(invoiceDate),
    currency: "EUR",
    discountAmount: 0,
    shippingFee: 0,
    items: [emptyB2BLineItem()],
  };
}

export function B2BQuoteWorkspace() {
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const { quotes, loading, saving, saveDraft, remove, refresh } = useB2BQuoteDrafts();
  const { sendEmail, sending } = useB2BQuoteDispatch();

  const [draft, setDraft] = useState<B2BQuoteDraft>(initialDraft);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState("SSB-B2B-DRAFT");
  const [exporting, setExporting] = useState(false);

  const logoUrl = settings.logo_main_url ?? settings.logo_secondary_png_url ?? null;
  const company = useMemo(
    () => ({
      companyName: settings.company_name ?? null,
      companyEmail: settings.company_email ?? null,
      companyPhone: settings.company_phone ?? null,
      companyAddress: settings.company_address ?? null,
    }),
    [settings]
  );

  const handleSave = useCallback(async () => {
    const items = draft.items.filter((it) => it.strainName.trim());
    if (!items.length) {
      toast({
        title: "Add line items",
        description: "Enter at least one strain name.",
        variant: "destructive",
      });
      return;
    }
    const result = await saveDraft({
      ...draft,
      items,
      id: activeId,
      quoteNumber: quoteNumber.startsWith("SSB-B2B-") && !quoteNumber.includes("DRAFT")
        ? quoteNumber
        : null,
    });
    if (result.success) {
      setActiveId(result.quote.id);
      setQuoteNumber(result.quote.quoteNumber);
      toast({ title: "Draft saved", description: result.quote.quoteNumber });
    } else {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
    }
  }, [draft, activeId, quoteNumber, saveDraft, toast]);

  const handleLoad = useCallback(
    (q: B2BQuoteRecord) => {
      setActiveId(q.id);
      setQuoteNumber(q.quoteNumber);
      setDraft({
        clientName: q.clientName,
        clientEmail: q.clientEmail,
        shippingAddress: q.shippingAddress,
        invoiceDate: q.invoiceDate,
        validUntil: q.validUntil,
        currency: q.currency,
        discountAmount: q.discountAmount,
        shippingFee: q.shippingFee,
        paymentNotes: q.paymentNotes,
        items: q.items.length ? q.items : [emptyB2BLineItem()],
      });
      toast({ title: "Loaded", description: q.quoteNumber });
    },
    [toast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        if (activeId === id) {
          setActiveId(null);
          setQuoteNumber("SSB-B2B-DRAFT");
        }
        toast({ title: "Deleted" });
      } catch (err) {
        toast({
          title: "Delete failed",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    },
    [remove, activeId, toast]
  );

  const handleSend = useCallback(async () => {
    const result = await sendEmail({
      ...draft,
      quoteId: activeId,
      quoteNumber: quoteNumber.includes("DRAFT") ? null : quoteNumber,
    });
    if (result.success) {
      if (result.quoteId) setActiveId(result.quoteId);
      if (result.quoteNumber) setQuoteNumber(result.quoteNumber);
      toast({ title: "Email sent", description: `To ${draft.clientEmail}` });
      await refresh();
    } else {
      toast({
        title: "Send failed",
        description: result.error,
        variant: "destructive",
      });
    }
  }, [draft, activeId, quoteNumber, sendEmail, refresh, toast]);

  const handlePdf = useCallback(() => {
    setExporting(true);
    try {
      exportB2BQuotePdf(draft, quoteNumber, logoUrl, company);
      toast({
        title: "Print dialog opened",
        description: 'Select "Save as PDF".',
      });
    } catch (err) {
      toast({
        title: "PDF failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setExporting(false), 400);
    }
  }, [draft, quoteNumber, logoUrl, company, toast]);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <B2BQuoteForm
          draft={draft}
          onChange={setDraft}
          onApplyOptionA={() => {
            const d = createMalikhaOptionA();
            setDraft(d);
            setActiveId(null);
            setQuoteNumber("SSB-B2B-DRAFT");
          }}
          onApplyOptionB={() => {
            const d = createMalikhaOptionB();
            setDraft(d);
            setActiveId(null);
            setQuoteNumber("SSB-B2B-DRAFT");
          }}
        />

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void handleSave()}
              disabled={saving || !draft.clientName.trim()}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save draft
            </Button>
            <Button
              type="button"
              className="w-full bg-[#12463e] hover:bg-[#0f3a34]"
              onClick={() => void handleSend()}
              disabled={sending || !draft.clientEmail.trim()}
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
              className="w-full"
              onClick={handlePdf}
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
            <CardTitle className="text-base font-semibold text-slate-800">History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : quotes.length === 0 ? (
              <p className="text-xs text-slate-500">No saved B2B quotes yet.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {quotes.map((q) => (
                  <li
                    key={q.id}
                    className={`flex items-start gap-1 rounded-md border px-2 py-1.5 ${
                      activeId === q.id
                        ? "border-[#12463e]/40 bg-[#12463e]/5"
                        : "border-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      className="min-h-12 flex-1 text-left"
                      onClick={() => handleLoad(q)}
                    >
                      <p className="text-xs font-medium text-slate-800">{q.quoteNumber}</p>
                      <p className="text-[10px] text-slate-500">
                        {q.clientName} · {q.status} · {q.currency}
                      </p>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 shrink-0 text-slate-400 hover:text-red-600"
                      onClick={() => void handleDelete(q.id)}
                      aria-label="Delete quote"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </aside>

      <div className="rounded-xl bg-slate-100/80 p-4 sm:p-6 lg:p-8">
        <ProFormaInvoiceTemplate
          draft={draft}
          quoteNumber={quoteNumber}
          logoUrl={logoUrl}
          {...company}
        />
      </div>
    </div>
  );
}
