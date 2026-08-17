"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BulkShareSgStrains } from "@/components/share/bulk/BulkShareSgStrains";
import { BulkShareSgfStrains } from "@/components/share/bulk/BulkShareSgfStrains";
import {
  BulkShareStrainSearch,
  type StrainSearchEntry,
} from "@/components/share/bulk/BulkShareStrainSearch";
import {
  BULK_SHARE_MIN_QTY,
  BULK_SHARE_PHOTO_FF_QTY,
  cartLineKey,
  priceLineFromBook,
  type BulkShareCartLine,
  type BulkShareStrainPick,
  type SerializedPricedBook,
} from "@/lib/bulk-share-order";
import { SEED_FORMAT_LABEL, SEEDS_GENETICS_SLUG } from "@/lib/bulk-seeds-book";
import { SGF_SEEDS_SHARE_TAGLINE, sgfStrainsGrouped } from "@/lib/sgf-seeds-share";
import { BULK_SHARE_COPY, BULK_SHARE_LANG_KEY, localizeQtyDescription, type BulkShareLang } from "@/lib/bulk-share-i18n";
import type { SgCategorySlug, SgCatalogStrain } from "@/lib/seeds-genetics-catalog";
import type { PartnerStrainRecord } from "@/types/partner-catalog";

type SgGroup = {
  slug: SgCategorySlug;
  label: string;
  strains: SgCatalogStrain[];
};

type Props = {
  token: string;
  title: string;
  expiresAt: number;
  pricedBooks: SerializedPricedBook[];
  sgfStrains?: PartnerStrainRecord[];
  sgGroups?: SgGroup[];
};

function fmtThb(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `฿${Math.ceil(n).toLocaleString("en-US")}`;
}

function fmtEur(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function LangToggle({
  lang,
  onChange,
}: {
  lang: BulkShareLang;
  onChange: (l: BulkShareLang) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-sm">
      <button
        type="button"
        onClick={() => onChange("th")}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          lang === "th" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          lang === "en" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        EN
      </button>
    </div>
  );
}

export function BulkShareOrderClient({
  token,
  title,
  expiresAt,
  pricedBooks,
  sgfStrains = [],
  sgGroups = [],
}: Props) {
  const [lang, setLang] = useState<BulkShareLang>("th");
  const [cart, setCart] = useState<BulkShareCartLine[]>([]);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState<string | null>(null);
  const [strainQuery, setStrainQuery] = useState("");

  const t = BULK_SHARE_COPY[lang];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BULK_SHARE_LANG_KEY);
      if (saved === "th" || saved === "en") setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function changeLang(next: BulkShareLang) {
    setLang(next);
    setError(null);
    try {
      localStorage.setItem(BULK_SHARE_LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const bookBySlug = useMemo(
    () => new Map(pricedBooks.map((b) => [b.supplierSlug, b])),
    [pricedBooks]
  );

  const addStrain = useCallback((pick: BulkShareStrainPick) => {
    const key = cartLineKey(pick.supplierSlug, pick.strainName);
    setFocusedKey(key);
    setCart((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) {
        if (hit.lockedQty) return prev;
        return prev.map((l) =>
          l.key === key ? { ...l, qty: l.qty + BULK_SHARE_MIN_QTY } : l
        );
      }
      return [
        ...prev,
        {
          ...pick,
          key,
          qty: pick.lockedQty ?? BULK_SHARE_MIN_QTY,
        },
      ];
    });
  }, []);

  const strainEntries = useMemo(() => {
    const entries: StrainSearchEntry[] = [];
    if (sgfStrains.length > 0) {
      for (const g of sgfStrainsGrouped(sgfStrains)) {
        for (const s of g.strains) {
          const category = g.bucket;
          entries.push({
            id: `gf-${s.id}`,
            supplierSlug: "green-future",
            supplierLabel: "SGF Seeds",
            strainName: s.strainName,
            category,
            lockedQty: category === "photo-ff" ? BULK_SHARE_PHOTO_FF_QTY : undefined,
          });
        }
      }
    }
    for (const g of sgGroups) {
      for (const s of g.strains) {
        const category = s.primaryCategory;
        entries.push({
          id: `sg-${s.id}`,
          supplierSlug: "seeds-genetics",
          supplierLabel: "Seeds Genetics",
          strainName: s.name,
          category,
          lockedQty: category === "photo-ff" ? BULK_SHARE_PHOTO_FF_QTY : undefined,
        });
      }
    }
    return entries.sort((a, b) => a.strainName.localeCompare(b.strainName));
  }, [sgfStrains, sgGroups]);

  const cartQtyByKey = useMemo(
    () => new Map(cart.map((l) => [l.key, l.qty])),
    [cart]
  );

  const hasStrains = strainEntries.length > 0;

  const updateQty = useCallback((key: string, raw: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.key !== key || l.lockedQty) return l;
        const qty = Math.max(BULK_SHARE_MIN_QTY, Math.floor(raw));
        return { ...l, qty };
      })
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
    setFocusedKey((k) => (k === key ? null : k));
  }, []);

  const pricedCart = useMemo(() => {
    return cart.map((line) => {
      const book = bookBySlug.get(line.supplierSlug);
      const priced =
        book != null ? priceLineFromBook(book, line.qty, line.category) : null;
      return { line, priced };
    });
  }, [cart, bookBySlug]);

  const totals = useMemo(() => {
    const strainCount = cart.length;
    const seedCount = pricedCart.reduce((s, { line }) => s + line.qty, 0);
    const subtotalThb = pricedCart.reduce((s, { priced }) => s + (priced?.lineThb ?? 0), 0);
    return { strainCount, seedCount, subtotalThb };
  }, [cart, pricedCart]);

  async function submitOrder() {
    setError(null);
    if (!contactName.trim()) {
      setError(t.errName);
      return;
    }
    if (!lineId.trim() && !phone.trim() && !email.trim()) {
      setError(t.errContact);
      return;
    }
    const emailNorm = email.trim().toLowerCase();
    if (emailNorm && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      setError(t.errEmail);
      return;
    }
    if (cart.length === 0) {
      setError(t.errEmpty);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/share/bulk/${encodeURIComponent(token)}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim(),
          email: emailNorm,
          lineId: lineId.trim(),
          phone: phone.trim(),
          note: note.trim() || undefined,
          items: cart.map((l) => ({
            supplierSlug: l.supplierSlug,
            strainName: l.strainName,
            category: l.category,
            qty: l.qty,
          })),
        }),
      });
      const json = (await res.json()) as { refNumber?: string; error?: string };
      if (!res.ok || !json.refNumber) {
        throw new Error(json.error ?? t.errFail);
      }
      setRefNumber(json.refNumber);
      setSheetOpen(false);
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const expireDate = new Date(expiresAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB");

  if (refNumber) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto mb-8 flex max-w-lg justify-end">
          <LangToggle lang={lang} onChange={changeLang} />
        </div>
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">{t.thanksEyebrow}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{t.thanksTitle}</h1>
          <p className="text-sm text-slate-600">{t.thanksBody}</p>
          <p className="font-mono text-lg font-semibold text-slate-900">{refNumber}</p>
          <p className="text-xs text-slate-400">{t.thanksKeep}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex justify-end">
            <LangToggle lang={lang} onChange={changeLang} />
          </div>
          <header className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{t.exclusive}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{t.pricePerSeed}</p>
            <p className="text-xs text-slate-400">
              {t.expires(expireDate)} · {t.tapToCart}
            </p>
          </header>

          {pricedBooks.map((book) => (
            <section
              key={book.supplierSlug}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">{book.supplierLabel}</h2>
                {book.supplierSlug === "green-future" ? (
                  <>
                    <p className="mt-1 text-xs text-slate-500">{SGF_SEEDS_SHARE_TAGLINE}</p>
                    <p className="text-xs text-slate-500">{t.sgfFormats}</p>
                  </>
                ) : null}
                {book.supplierSlug === SEEDS_GENETICS_SLUG ? (
                  <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium leading-snug text-sky-950">
                    {t.sgImportNote}
                  </p>
                ) : null}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-medium">{t.qtyCol}</th>
                    <th className="px-4 py-2 text-right font-medium">{t.priceCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {book.rows.map((row) => (
                    <tr key={row.minQty} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800">{row.label}</p>
                        <p className="text-xs text-slate-500">
                          {localizeQtyDescription(row.qtyDescription, lang)}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <p className="font-mono text-sm font-semibold text-slate-900">
                          {fmtThb(row.sellThb)}
                        </p>
                        {row.sellEur > 0 ? (
                          <p className="font-mono text-[11px] text-slate-400">{fmtEur(row.sellEur)}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          {hasStrains ? (
            <BulkShareStrainSearch
              entries={strainEntries}
              query={strainQuery}
              onQueryChange={setStrainQuery}
              onAddStrain={addStrain}
              cartQtyByKey={cartQtyByKey}
              focusedKey={focusedKey}
              lang={lang}
            />
          ) : null}

          {sgfStrains.length > 0 ? (
            <BulkShareSgfStrains
              strains={sgfStrains}
              onAddStrain={addStrain}
              focusedKey={focusedKey}
              lang={lang}
              query={strainQuery}
              cartQtyByKey={cartQtyByKey}
            />
          ) : null}

          {sgGroups.length > 0 ? (
            <BulkShareSgStrains
              groups={sgGroups}
              onAddStrain={addStrain}
              focusedKey={focusedKey}
              lang={lang}
              query={strainQuery}
              cartQtyByKey={cartQtyByKey}
            />
          ) : null}

          {cart.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">{t.cart}</h2>
              <ul className="mt-3 space-y-3">
                {pricedCart.map(({ line, priced }) => (
                  <li
                    key={line.key}
                    className={`rounded-xl border p-3 ${
                      focusedKey === line.key ? "border-emerald-300 bg-emerald-50/40" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{line.strainName}</p>
                        <p className="text-xs text-slate-500">
                          {line.supplierLabel}
                          {line.category
                            ? ` · ${SEED_FORMAT_LABEL[line.category as keyof typeof SEED_FORMAT_LABEL] ?? line.category}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="shrink-0 rounded p-1 text-slate-400 hover:text-red-600"
                        aria-label={t.remove}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {line.lockedQty ? (
                        <span className="text-xs text-slate-500">
                          {t.seedsPhotoFf(BULK_SHARE_PHOTO_FF_QTY.toLocaleString())}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded border border-slate-200 p-1 hover:bg-slate-50"
                            onClick={() => updateQty(line.key, line.qty - 50)}
                            aria-label={t.decrease}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <Input
                            type="number"
                            min={BULK_SHARE_MIN_QTY}
                            step={50}
                            value={line.qty}
                            onChange={(e) => updateQty(line.key, Number(e.target.value))}
                            className="h-8 w-24 text-center font-mono text-sm"
                          />
                          <button
                            type="button"
                            className="rounded border border-slate-200 p-1 hover:bg-slate-50"
                            onClick={() => updateQty(line.key, line.qty + 50)}
                            aria-label={t.increase}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs text-slate-400">{t.minQty(BULK_SHARE_MIN_QTY)}</span>
                        </div>
                      )}
                      <div className="text-right">
                        {priced ? (
                          <>
                            <p className="font-mono text-sm font-semibold text-slate-900">
                              {fmtThb(priced.lineThb)}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400">
                              {fmtThb(priced.unitThb)}
                              {t.perSeed} · {fmtEur(priced.unitEur)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-red-600">{t.invalidQty}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-center text-[11px] text-slate-400">{t.confidential}</p>
        </div>
      </main>

      {totals.strainCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-slate-900">
                {t.strainCount(totals.strainCount, totals.seedCount.toLocaleString())}
              </p>
              <p className="font-mono text-xs text-slate-500">{fmtThb(totals.subtotalThb)}</p>
            </div>
            <Button type="button" onClick={() => setSheetOpen(true)} className="shrink-0">
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {t.submitOrder}
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t.sheetTitle}</SheetTitle>
            <SheetDescription>
              {t.strainCount(totals.strainCount, totals.seedCount.toLocaleString())} ·{" "}
              {fmtThb(totals.subtotalThb)}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="contactName">{t.name}</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t.namePh}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPh}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lineId">{t.lineId}</Label>
              <Input
                id="lineId"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder={t.linePh}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePh}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">{t.note}</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.notePh}
                rows={2}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={busy}>
              {t.cancel}
            </Button>
            <Button type="button" onClick={() => void submitOrder()} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {t.confirm}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
