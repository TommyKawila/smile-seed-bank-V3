"use client";

import { useCallback, useMemo, useState } from "react";
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
  BULK_SHARE_MIN_QTY,
  BULK_SHARE_PHOTO_FF_QTY,
  cartLineKey,
  defaultQtyForCategory,
  isPhotoFfCategory,
  priceLineFromBook,
  type BulkShareCartLine,
  type BulkShareStrainPick,
  type SerializedPricedBook,
} from "@/lib/bulk-share-order";
import { SEED_FORMAT_LABEL, SEEDS_GENETICS_SLUG } from "@/lib/bulk-seeds-book";
import { SGF_SEEDS_SHARE_TAGLINE } from "@/lib/sgf-seeds-share";
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

export function BulkShareOrderClient({
  token,
  title,
  expiresAt,
  pricedBooks,
  sgfStrains = [],
  sgGroups = [],
}: Props) {
  const [cart, setCart] = useState<BulkShareCartLine[]>([]);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [lineId, setLineId] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState<string | null>(null);

  const bookBySlug = useMemo(
    () => new Map(pricedBooks.map((b) => [b.supplierSlug, b])),
    [pricedBooks]
  );

  const addStrain = useCallback((pick: BulkShareStrainPick) => {
    const key = cartLineKey(pick.supplierSlug, pick.strainName);
    setFocusedKey(key);
    setCart((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) return prev;
      return [
        ...prev,
        {
          ...pick,
          key,
          qty: pick.lockedQty ?? defaultQtyForCategory(pick.category),
        },
      ];
    });
  }, []);

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
      setError("กรุณากรอกชื่อ");
      return;
    }
    if (!lineId.trim() && !phone.trim()) {
      setError("กรุณากรอก LINE ID หรือเบอร์โทร");
      return;
    }
    if (cart.length === 0) {
      setError("ตะกร้าว่าง");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/share/bulk/${encodeURIComponent(token)}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim(),
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
        throw new Error(json.error ?? "ส่งไม่สำเร็จ");
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

  if (refNumber) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">ส่งคำสั่งแล้ว</p>
          <h1 className="text-2xl font-semibold text-slate-900">ขอบคุณครับ</h1>
          <p className="text-sm text-slate-600">
            เราได้รับคำสั่งของคุณแล้ว — ทีม Smile Seed Bank จะติดต่อกลับเร็วๆ นี้
          </p>
          <p className="font-mono text-lg font-semibold text-slate-900">{refNumber}</p>
          <p className="text-xs text-slate-400">เก็บเลขอ้างอิงนี้ไว้สำหรับติดตาม</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Exclusive offer</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">
              Smile Seed Bank · ราคาต่อเมล็ด (THB) ตามปริมาณ · ไม่รวมค่าขนส่งปลายทาง
            </p>
            <p className="text-xs text-slate-400">
              ลิงก์หมดอายุ {new Date(expiresAt).toLocaleDateString("th-TH")} · กดชื่อสายเพื่อเพิ่มในตะกร้า
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
                    <p className="text-xs text-slate-500">Photo · Auto · Photo FF</p>
                  </>
                ) : null}
                {book.supplierSlug === SEEDS_GENETICS_SLUG ? (
                  <p className="mt-1 text-xs text-slate-500">
                    ราคารวมบริการนำเข้า — สูงกว่า bulk สาธารณะของ Seeds Genetics เล็กน้อย
                  </p>
                ) : null}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-medium">ปริมาณ</th>
                    <th className="px-4 py-2 text-right font-medium">ราคา / เมล็ด</th>
                  </tr>
                </thead>
                <tbody>
                  {book.rows.map((row) => (
                    <tr key={row.minQty} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800">{row.label}</p>
                        <p className="text-xs text-slate-500">{row.qtyDescription}</p>
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

          {sgfStrains.length > 0 ? (
            <BulkShareSgfStrains
              strains={sgfStrains}
              onAddStrain={addStrain}
              focusedKey={focusedKey}
            />
          ) : null}

          {sgGroups.length > 0 ? (
            <BulkShareSgStrains groups={sgGroups} onAddStrain={addStrain} focusedKey={focusedKey} />
          ) : null}

          {cart.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">ตะกร้า</h2>
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
                          {line.category ? ` · ${SEED_FORMAT_LABEL[line.category as keyof typeof SEED_FORMAT_LABEL] ?? line.category}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="shrink-0 rounded p-1 text-slate-400 hover:text-red-600"
                        aria-label="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {line.lockedQty ? (
                        <span className="text-xs text-slate-500">
                          {BULK_SHARE_PHOTO_FF_QTY.toLocaleString()} เมล็ด (Photo FF)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded border border-slate-200 p-1 hover:bg-slate-50"
                            onClick={() => updateQty(line.key, line.qty - 50)}
                            aria-label="ลด"
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
                            aria-label="เพิ่ม"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs text-slate-400">ขั้นต่ำ {BULK_SHARE_MIN_QTY}</span>
                        </div>
                      )}
                      <div className="text-right">
                        {priced ? (
                          <>
                            <p className="font-mono text-sm font-semibold text-slate-900">
                              {fmtThb(priced.lineThb)}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400">
                              {fmtThb(priced.unitThb)}/เมล็ด · {fmtEur(priced.unitEur)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-red-600">จำนวนไม่ถูกต้อง</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-center text-[11px] text-slate-400">
            Confidential · not for public listing · Smile Seed Bank
          </p>
        </div>
      </main>

      {totals.strainCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-slate-900">
                {totals.strainCount} สาย · {totals.seedCount.toLocaleString()} เมล็ด
              </p>
              <p className="font-mono text-xs text-slate-500">{fmtThb(totals.subtotalThb)}</p>
            </div>
            <Button type="button" onClick={() => setSheetOpen(true)} className="shrink-0">
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              ส่งคำสั่งซื้อ
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>ส่งคำสั่งซื้อ</SheetTitle>
            <SheetDescription>
              {totals.strainCount} สาย · {totals.seedCount.toLocaleString()} เมล็ด ·{" "}
              {fmtThb(totals.subtotalThb)}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="contactName">ชื่อ *</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="ชื่อผู้ติดต่อ"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lineId">LINE ID</Label>
              <Input
                id="lineId"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="@username หรือ LINE ID"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">โทร</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08x-xxx-xxxx"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ไม่บังคับ"
                rows={2}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={() => void submitOrder()} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              ยืนยันส่งคำสั่ง
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
