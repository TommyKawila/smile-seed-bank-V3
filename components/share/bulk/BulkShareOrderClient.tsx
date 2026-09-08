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
import { BulkSharePriceTable } from "@/components/share/bulk/BulkSharePriceTable";
import { BulkShareStrainCatalog } from "@/components/share/bulk/BulkShareStrainCatalog";
import {
  BULK_SHARE_MIN_QTY,
  cartLineKey,
  priceLineFromBook,
  type BulkShareCartLine,
  type BulkShareStrainPick,
  type SerializedPricedBook,
} from "@/lib/bulk-share-order";
import { SEED_FORMAT_LABEL } from "@/lib/bulk-seeds-book";
import { BULK_SHARE_COPY, BULK_SHARE_LANG_KEY, type BulkShareLang } from "@/lib/bulk-share-i18n";
import { GfGateNoticeBanner } from "@/components/storefront/wholesale/GfGateNoticeBanner";
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
    <div className="inline-flex rounded-lg border border-border bg-slate-900/60 p-0.5 text-xs shadow-sm">
      <button
        type="button"
        onClick={() => onChange("th")}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          lang === "th" ? "bg-emerald-500 text-slate-950" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          lang === "en" ? "bg-emerald-500 text-slate-950" : "text-muted-foreground hover:text-foreground"
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
        return prev.map((l) =>
          l.key === key ? { ...l, qty: l.qty + BULK_SHARE_MIN_QTY } : l
        );
      }
      return [
        ...prev,
        {
          ...pick,
          key,
          qty: BULK_SHARE_MIN_QTY,
        },
      ];
    });
  }, []);

  const strainEntries = useMemo(
    () => sgfStrains.length > 0 || sgGroups.length > 0,
    [sgfStrains.length, sgGroups.length]
  );

  const cartSeedBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) {
      map.set(line.supplierSlug, (map.get(line.supplierSlug) ?? 0) + line.qty);
    }
    return map;
  }, [cart]);

  const cartQtyByKey = useMemo(
    () => new Map(cart.map((l) => [l.key, l.qty])),
    [cart]
  );

  const hasStrains = strainEntries;

  const updateQty = useCallback((key: string, raw: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
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
      <main className="min-h-screen bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto mb-8 flex max-w-lg justify-end">
          <LangToggle lang={lang} onChange={changeLang} />
        </div>
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400">{t.thanksEyebrow}</p>
          <h1 className="text-2xl font-semibold text-foreground">{t.thanksTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.thanksBody}</p>
          <p className="font-mono text-lg font-semibold text-foreground">{refNumber}</p>
          <p className="text-xs text-muted-foreground">{t.thanksKeep}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-background px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex justify-end">
            <LangToggle lang={lang} onChange={changeLang} />
          </div>
          <header className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t.exclusive}</p>
            <h1 className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{t.pricePerSeed}</p>
            <p className="text-xs text-muted-foreground">
              {t.expires(expireDate)} · {t.tapToCart}
            </p>
            <p className="mx-auto mt-3 max-w-xl rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
              {t.catalogDisclaimer}
            </p>
          </header>

          {sgfStrains.length > 0 ? (
            <GfGateNoticeBanner showNonBinding variant="dark" />
          ) : null}

          {pricedBooks.map((book) => (
            <BulkSharePriceTable
              key={book.supplierSlug}
              book={book}
              lang={lang}
              cartSeedCount={cartSeedBySupplier.get(book.supplierSlug) ?? 0}
            />
          ))}

          {hasStrains ? (
            <BulkShareStrainCatalog
              sgfStrains={sgfStrains}
              sgGroups={sgGroups}
              onAddStrain={addStrain}
              focusedKey={focusedKey}
              cartQtyByKey={cartQtyByKey}
              lang={lang}
              query={strainQuery}
              onQueryChange={setStrainQuery}
            />
          ) : null}

          {cart.length > 0 ? (
            <section className="rounded-2xl border border-border bg-slate-900/40 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">{t.cart}</h2>
              <ul className="mt-3 space-y-3">
                {pricedCart.map(({ line, priced }) => (
                  <li
                    key={line.key}
                    className={`rounded-xl border p-3 ${
                      focusedKey === line.key
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{line.strainName}</p>
                        <p className="text-xs text-muted-foreground">
                          {line.supplierLabel}
                          {line.category
                            ? ` · ${SEED_FORMAT_LABEL[line.category as keyof typeof SEED_FORMAT_LABEL] ?? line.category}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-400"
                        aria-label={t.remove}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded border border-border p-1 hover:bg-slate-800"
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
                          className="h-8 w-24 border-border bg-slate-900/60 text-center font-mono text-sm text-foreground"
                        />
                        <button
                          type="button"
                          className="rounded border border-border p-1 hover:bg-slate-800"
                          onClick={() => updateQty(line.key, line.qty + 50)}
                          aria-label={t.increase}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs text-muted-foreground">{t.minQty(BULK_SHARE_MIN_QTY)}</span>
                      </div>
                      <div className="text-right">
                        {priced ? (
                          <>
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {fmtThb(priced.lineThb)}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {fmtThb(priced.unitThb)}
                              {t.perSeed} · {fmtEur(priced.unitEur)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-red-400">{t.invalidQty}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-center text-[11px] text-muted-foreground">{t.confidential}</p>
        </div>
      </main>

      {totals.strainCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-slate-950/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-foreground">
                {t.strainCount(totals.strainCount, totals.seedCount.toLocaleString())}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{fmtThb(totals.subtotalThb)}</p>
            </div>
            <Button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="shrink-0 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {t.submitOrder}
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-border bg-slate-950 text-foreground"
        >
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
            <Button type="button" onClick={() => void submitOrder()} disabled={busy} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {t.confirm}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
