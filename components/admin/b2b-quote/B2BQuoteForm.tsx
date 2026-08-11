"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateB2BQuoteTotals,
  formatB2BMoney,
  moqWarningForQty,
  recalculateItem,
} from "@/lib/b2b-quote-calc";
import {
  B2B_PRESET_STRAINS,
  defaultValidUntil,
  emptyB2BLineItem,
  type B2BCurrency,
  type B2BQuoteDraft,
  type B2BQuoteLineItem,
} from "@/types/b2b-quote";

type Props = {
  draft: B2BQuoteDraft;
  onChange: (next: B2BQuoteDraft) => void;
};

export function B2BQuoteForm({ draft, onChange }: Props) {
  const [partnerRefs, setPartnerRefs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/partners/green-future/refs", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { refs?: string[] };
        if (!cancelled) setPartnerRefs(json.refs ?? []);
      } catch {
        /* optional enrichment */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = calculateB2BQuoteTotals(
    draft.items,
    draft.discountAmount,
    draft.shippingFee,
    draft.currency
  );

  const patch = (partial: Partial<B2BQuoteDraft>) => onChange({ ...draft, ...partial });

  const setCurrency = (currency: B2BCurrency) => {
    const items = draft.items.map((it) => recalculateItem(it, currency));
    patch({ currency, items });
  };

  const updateItem = (id: string, patchItem: Partial<B2BQuoteLineItem>) => {
    const items = draft.items.map((it) =>
      it.id === id ? recalculateItem({ ...it, ...patchItem }, draft.currency) : it
    );
    patch({ items });
  };

  const removeItem = (id: string) => {
    const items = draft.items.filter((it) => it.id !== id);
    patch({ items: items.length ? items : [emptyB2BLineItem()] });
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Client / Company</Label>
            <Input
              value={draft.clientName}
              onChange={(e) => patch({ clientName: e.target.value })}
              placeholder="Client / Company name"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Email</Label>
            <Input
              type="email"
              value={draft.clientEmail}
              onChange={(e) => patch({ clientEmail: e.target.value })}
              placeholder="client@example.com"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Shipping / City</Label>
            <Input
              value={draft.shippingAddress}
              onChange={(e) => patch({ shippingAddress: e.target.value })}
              placeholder="Bangkok, Thailand"
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Invoice date</Label>
              <Input
                type="date"
                value={draft.invoiceDate}
                onChange={(e) => {
                  const invoiceDate = e.target.value;
                  patch({
                    invoiceDate,
                    validUntil: defaultValidUntil(invoiceDate),
                  });
                }}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Valid until</Label>
              <Input
                type="date"
                value={draft.validUntil}
                onChange={(e) => patch({ validUntil: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Currency</Label>
            <div className="flex gap-2">
              {(["EUR", "THB"] as const).map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={draft.currency === c ? "default" : "outline"}
                  className={
                    draft.currency === c
                      ? "bg-[#12463e] hover:bg-[#0f3a34]"
                      : ""
                  }
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Line items
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button asChild type="button" size="sm" variant="ghost" className="h-8 text-xs">
              <Link href="/admin/partners/green-future" target="_blank">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Green Future
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => patch({ items: [...draft.items, emptyB2BLineItem()] })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.items.map((it) => {
            const warn = moqWarningForQty(it.quantity);
            return (
              <div
                key={it.id}
                className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Strain</Label>
                  <Input
                    list="b2b-strain-presets"
                    value={it.strainName}
                    onChange={(e) => updateItem(it.id, { strainName: e.target.value })}
                    placeholder="AF99 (BUBBA KUSH AUTO)"
                    className="h-9 bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(it.id, { quantity: Number(e.target.value) || 0 })
                      }
                      className="h-9 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Unit</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) =>
                        updateItem(it.id, { unitPrice: Number(e.target.value) || 0 })
                      }
                      className="h-9 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Line</Label>
                    <Input
                      readOnly
                      value={formatB2BMoney(it.lineTotal, draft.currency)}
                      className="h-9 bg-slate-100"
                    />
                  </div>
                </div>
                {warn ? (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {warn}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500"
                  onClick={() => removeItem(it.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            );
          })}
          <datalist id="b2b-strain-presets">
            {partnerRefs.map((s) => (
              <option key={s} value={s} />
            ))}
            {B2B_PRESET_STRAINS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Discount</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.discountAmount}
                onChange={(e) => patch({ discountAmount: Number(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Shipping fee</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.shippingFee}
                onChange={(e) => patch({ shippingFee: Number(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatB2BMoney(totals.subtotal, draft.currency)}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold text-[#12463e]">
              <span>Total</span>
              <span>{formatB2BMoney(totals.totalAmount, draft.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Note / Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Freebies, terms, or extra notes</Label>
            <Textarea
              value={draft.paymentNotes ?? ""}
              onChange={(e) => patch({ paymentNotes: e.target.value })}
              placeholder="Freebies: 50 White Widow seeds"
              rows={4}
              className="resize-y text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
