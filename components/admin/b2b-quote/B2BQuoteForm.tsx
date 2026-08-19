"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateB2BQuoteTotals,
  convertB2BDraftCurrency,
  formatB2BMoney,
  formatB2BUnitPrice,
} from "@/lib/b2b-quote-calc";
import {
  applyBulkBookPrice,
  B2B_BULK_QTY_STEP,
  emptyBulkPricedLineItem,
  snapB2BBulkQty,
} from "@/lib/b2b-quote-bulk-price";
import { SEEDS_GENETICS_CATALOG } from "@/lib/seeds-genetics-catalog";
import {
  B2B_CURRENCIES,
  B2B_BREEDER_SG,
  B2B_BREEDER_SGF,
  defaultValidUntil,
  type B2BCurrency,
  type B2BQuoteDraft,
  type B2BQuoteLineItem,
} from "@/types/b2b-quote";
import type { B2BQuoteChannel } from "@/lib/b2b-quote-channel";
import { channelBreeder } from "@/lib/b2b-quote-channel";

type StrainPreset = {
  id: string;
  strainName: string;
  breederName: string;
  /** Value shown in datalist (strain · breeder). */
  value: string;
};

type Props = {
  draft: B2BQuoteDraft;
  onChange: (next: B2BQuoteDraft) => void;
  channel?: B2BQuoteChannel | null;
};

export function B2BQuoteForm({ draft, onChange, channel = null }: Props) {
  const [sgfPresets, setSgfPresets] = useState<StrainPreset[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/partners/green-future?limit=500", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          strains?: { id: string | number; strainName?: string; varietyCode?: string }[];
        };
        if (cancelled) return;
        const next: StrainPreset[] = [];
        for (const s of json.strains ?? []) {
          const name = (s.strainName ?? "").trim();
          if (!name) continue;
          next.push({
            id: `sgf-${s.id}`,
            strainName: name,
            breederName: B2B_BREEDER_SGF,
            value: `${name} · ${B2B_BREEDER_SGF}`,
          });
          const code = (s.varietyCode ?? "").trim();
          if (code) {
            const coded = `${code} (${name.toUpperCase()})`;
            next.push({
              id: `sgf-code-${s.id}`,
              strainName: coded,
              breederName: B2B_BREEDER_SGF,
              value: `${coded} · ${B2B_BREEDER_SGF}`,
            });
          }
        }
        setSgfPresets(next);
      } catch {
        /* optional enrichment */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sgPresets = useMemo<StrainPreset[]>(
    () =>
      SEEDS_GENETICS_CATALOG.strains.map((s) => ({
        id: `sg-${s.id}`,
        strainName: s.name,
        breederName: B2B_BREEDER_SG,
        value: `${s.name} · ${B2B_BREEDER_SG}`,
      })),
    []
  );

  const lockedBreeder = channel ? channelBreeder(channel) : null;

  const allPresets = useMemo(() => {
    if (channel === "gf") return sgfPresets;
    if (channel === "sg") return sgPresets;
    return [...sgfPresets, ...sgPresets];
  }, [channel, sgfPresets, sgPresets]);
  const presetByValue = useMemo(() => {
    const map = new Map<string, StrainPreset>();
    for (const p of allPresets) map.set(p.value.toLowerCase(), p);
    for (const p of allPresets) {
      if (!map.has(p.strainName.toLowerCase())) map.set(p.strainName.toLowerCase(), p);
    }
    return map;
  }, [allPresets]);

  const totals = calculateB2BQuoteTotals(
    draft.items,
    draft.discountAmount,
    draft.shippingFee,
    draft.currency
  );

  const patch = (partial: Partial<B2BQuoteDraft>) => onChange({ ...draft, ...partial });

  const setCurrency = (currency: B2BCurrency) => {
    onChange(convertB2BDraftCurrency(draft, currency));
  };

  const updateItem = (id: string, patchItem: Partial<B2BQuoteLineItem>) => {
    const items = draft.items.map((it) => {
      if (it.id !== id) return it;
      const merged = lockedBreeder
        ? { ...it, ...patchItem, breederName: lockedBreeder }
        : { ...it, ...patchItem };
      return applyBulkBookPrice(merged, draft.currency);
    });
    patch({ items });
  };

  const bumpQty = (id: string, delta: number) => {
    const hit = draft.items.find((it) => it.id === id);
    if (!hit) return;
    updateItem(id, { quantity: snapB2BBulkQty(hit.quantity + delta) });
  };

  const onStrainInput = (id: string, raw: string) => {
    const hit = presetByValue.get(raw.trim().toLowerCase());
    if (hit) {
      updateItem(id, { strainName: hit.strainName, breederName: hit.breederName });
      return;
    }
    updateItem(id, { strainName: raw });
  };

  const removeItem = (id: string) => {
    const items = draft.items.filter((it) => it.id !== id);
    const fallbackBreeder = lockedBreeder ?? B2B_BREEDER_SGF;
    patch({
      items: items.length ? items : [emptyBulkPricedLineItem(fallbackBreeder, draft.currency)],
    });
  };

  const addLineBreeder = lockedBreeder ?? B2B_BREEDER_SGF;

  return (
    <div className="space-y-4">
      {channel ? (
        <div className="rounded-lg border border-[#12463e]/30 bg-[#12463e]/5 px-3 py-2 text-xs text-[#12463e]">
          {channel === "gf"
            ? "GF channel — SGF Seeds only. Mixed breeders blocked on send/PDF."
            : "SG channel — Seeds Genetics only. Mixed breeders blocked on send/PDF."}
        </div>
      ) : null}
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
              {B2B_CURRENCIES.map((c) => (
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
            <p className="text-[11px] text-slate-500">
              สลับสกุลเงินแปลงผ่าน EUR (฿ จาก bulk book · $ ≈ € × 1.17)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Line items
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {channel !== "sg" ? (
              <Button asChild type="button" size="sm" variant="ghost" className="h-8 text-xs">
                <Link href="/admin/partners/green-future" target="_blank">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  SGF Seeds
                </Link>
              </Button>
            ) : null}
            {channel !== "gf" ? (
              <Button asChild type="button" size="sm" variant="ghost" className="h-8 text-xs">
                <Link href="/admin/bulk-seeds" target="_blank">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Seeds Genetics
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch({
                  items: [
                    ...draft.items,
                    emptyBulkPricedLineItem(addLineBreeder, draft.currency),
                  ],
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.items.map((it) => (
            <div
              key={it.id}
              className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Strain</Label>
                <Input
                  list="b2b-strain-presets"
                  value={it.strainName}
                  onChange={(e) => onStrainInput(it.id, e.target.value)}
                  placeholder="Critical 2.0 Autoflower"
                  className="h-9 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Breeder</Label>
                {lockedBreeder ? (
                  <p className="text-sm font-medium text-[#12463e]">{lockedBreeder}</p>
                ) : (
                  <div className="flex gap-2">
                    {([B2B_BREEDER_SGF, B2B_BREEDER_SG] as const).map((b) => (
                      <Button
                        key={b}
                        type="button"
                        size="sm"
                        variant={it.breederName === b ? "default" : "outline"}
                        className={
                          it.breederName === b ? "bg-[#12463e] hover:bg-[#0f3a34]" : ""
                        }
                        onClick={() => updateItem(it.id, { breederName: b })}
                      >
                        {b}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Qty (+{B2B_BULK_QTY_STEP})</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => bumpQty(it.id, -B2B_BULK_QTY_STEP)}
                      aria-label="Decrease qty"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      readOnly
                      value={it.quantity}
                      className="h-9 bg-slate-100 text-center font-mono"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => bumpQty(it.id, B2B_BULK_QTY_STEP)}
                      aria-label="Increase qty"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Unit (Bulk seeds)</Label>
                  <Input
                    readOnly
                    value={formatB2BUnitPrice(it.unitPrice, draft.currency)}
                    className="h-9 bg-slate-100 font-mono text-sm"
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
          ))}
          <datalist id="b2b-strain-presets">
            {allPresets.map((p) => (
              <option key={p.id} value={p.value} />
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
