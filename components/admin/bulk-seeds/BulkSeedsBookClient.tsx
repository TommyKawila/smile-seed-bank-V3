"use client";

import { useMemo, useState } from "react";
import { Check, Link2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  BULK_SUPPLIER_BOOKS,
  DEFAULT_EUR_THB,
  SEED_FORMAT_LABEL,
  SEEDS_GENETICS_PUBLIC_TIERS,
  SEEDS_GENETICS_PUBLIC_PREMIUM_EUR,
  customerSellEurFloor,
  priceSupplierBook,
  type BulkSupplierSlug,
} from "@/lib/bulk-seeds-book";
import { ADDERS_BY_LANE, GM_BY_QTY } from "@/lib/bulk-seeds-trade";
import { GfStrainCatalogPanel } from "@/components/admin/bulk-seeds/GfStrainCatalogPanel";
import { SgStrainCatalogPanel } from "@/components/admin/bulk-seeds/SgStrainCatalogPanel";
import { BulkShareLeadsPanel } from "@/components/admin/bulk-seeds/BulkShareLeadsPanel";

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function thb(n: number, digits = 2): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `฿${fmt(n, digits)}`;
}

function DualMoney({
  thbValue,
  eurValue,
  thbDigits = 2,
}: {
  thbValue: number;
  eurValue?: number | null;
  thbDigits?: number;
}) {
  return (
    <>
      {thb(thbValue, thbDigits)}
      {eurValue != null && eurValue > 0 ? (
        <span className="block text-[10px] text-slate-400">€{fmt(eurValue)}</span>
      ) : null}
    </>
  );
}

export function BulkSeedsBookClient() {
  const { toast } = useToast();
  const [eurThb, setEurThb] = useState(DEFAULT_EUR_THB);
  const [gmOverride, setGmOverride] = useState("");
  const [landed, setLanded] = useState<Record<BulkSupplierSlug, number>>({
    "green-future": BULK_SUPPLIER_BOOKS[0]?.recommendedLandedPct ?? 10,
    "seeds-genetics": BULK_SUPPLIER_BOOKS[1]?.recommendedLandedPct ?? 20,
  });
  const [shareTitle, setShareTitle] = useState("Smile Seed Bank — bulk offer");
  const [shareDays, setShareDays] = useState(14);
  const [shareSuppliers, setShareSuppliers] = useState<BulkSupplierSlug[]>([
    "green-future",
    "seeds-genetics",
  ]);
  const [showStrains, setShowStrains] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const overrideNum = gmOverride.trim() === "" ? null : Number(gmOverride);

  const priced = useMemo(
    () =>
      BULK_SUPPLIER_BOOKS.map((book) => ({
        book,
        rows: priceSupplierBook({
          book,
          eurThb,
          landedPct: landed[book.slug],
          gmOverride: overrideNum != null && Number.isFinite(overrideNum) ? overrideNum : null,
        }),
      })),
    [eurThb, landed, overrideNum]
  );

  function toggleSupplier(slug: BulkSupplierSlug) {
    setShareSuppliers((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function mintLink() {
    setBusy(true);
    setLink(null);
    try {
      const res = await fetch("/api/admin/bulk-seeds/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: shareTitle,
          days: shareDays,
          suppliers: shareSuppliers,
          showStrains,
          gmOverride: overrideNum,
          landed,
          eurThb,
        }),
      });
      const json = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !json.path) throw new Error(json.error ?? "Failed");
      const url = `${window.location.origin}${json.path}`;
      setLink(url);
      await navigator.clipboard.writeText(url);
      toast({ title: "คัดลอกลิงก์ exclusive แล้ว", description: url });
    } catch (err) {
      toast({
        title: "สร้างลิงก์ไม่สำเร็จ",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            หลักการบวกราคา (ไม่โชว์ลูกค้า)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            ต้นทุนขายได้ (landed) = ราคาผู้ผลิต × (1 + landed %). ราคาขาย B2B =
            landed ÷ (1 − GM). อย่าใช้ markup บนต้นทุนแทน GM — จะขายถูกเกินและเข้าเนื้อ
          </p>
          <p className="text-xs text-slate-500">
            Incoterms 2020 (ICC) กำหนดว่าค่าระวางอยู่ในใบราคาหรือยัง · ใช้ GM ตามปริมาณ
            เพื่อส่งต่อส่วนลดวอลุ่มบางส่วน แต่ไม่ถอดกำไรทิ้ง
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {priced.map(({ book }) => (
              <div key={book.slug} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {book.name} · {book.origin} · {book.incoterm}
                </p>
                {book.formats.length > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-600">
                    {book.formats.map((f) => SEED_FORMAT_LABEL[f]).join(" · ")}
                    {book.strainListPending ? " · ลิสต์สายพันธุ์รอไฟล์" : ""}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-amber-800">{book.notesTh}</p>
                {book.lotFreightThb > 0 ? (
                  <p className="mt-1.5 text-xs font-medium text-slate-800">
                    ค่าส่ง {book.lotFreightThb.toLocaleString("th-TH")} บาท/ล็อต
                    <span className="font-normal text-slate-500">
                      {" "}
                      — หารตามจำนวนเมล็ดในขั้น ไม่ใช่ %
                    </span>
                  </p>
                ) : null}
                <ul className="mt-2 space-y-1.5 text-xs">
                  {ADDERS_BY_LANE[book.lane].map((row) => (
                    <li key={row.code}>
                      <span className="font-medium text-slate-800">
                        +{row.recommendedPct}% {row.labelTh}
                      </span>
                      <span className="block text-slate-500">{row.whyTh}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs font-medium text-slate-700">
                  รวมแนะนำ {book.recommendedLandedPct}% บน (เมล็ด + ค่าส่ง/เมล็ด)
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            ขั้นบันได GM:{" "}
            {GM_BY_QTY.map((g) => `${g.minQty.toLocaleString()}=${g.gmPct}%`).join(" · ")}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">EUR → THB</Label>
          <Input
            type="number"
            min={1}
            step={0.01}
            value={eurThb}
            onChange={(e) => setEurThb(Number(e.target.value) || DEFAULT_EUR_THB)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Override GM % (ว่าง = ตามขั้น)</Label>
          <Input
            type="number"
            min={0}
            max={90}
            step={1}
            value={gmOverride}
            onChange={(e) => setGmOverride(e.target.value)}
          />
        </div>
        {BULK_SUPPLIER_BOOKS.map((book) => (
          <div key={book.slug} className="space-y-1">
            <Label className="text-xs">Landed % · {book.name}</Label>
            <Input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={landed[book.slug]}
              onChange={(e) =>
                setLanded((prev) => ({
                  ...prev,
                  [book.slug]: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        ))}
      </div>

      {priced.map(({ book, rows }) => (
        <div key={book.slug} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {book.name}{" "}
            <span className="font-normal text-slate-500">
              · cost / landed / sell
            </span>
          </h3>
          {book.slug === "seeds-genetics" ? (
            <p className="text-[11px] text-slate-500">
              เว็บสาธารณะ{" "}
              {SEEDS_GENETICS_PUBLIC_TIERS.map(
                (t) => `${t.label} ${thb(t.publicEur * eurThb, 0)} (€${t.publicEur.toFixed(2)})`
              ).join(" · ")}
              {" "}· ขายลูกค้า = เว็บ + €{SEEDS_GENETICS_PUBLIC_PREMIUM_EUR.toFixed(2)} (
              {book.tiers
                .map((t) => {
                  const floor = customerSellEurFloor(t.minQty);
                  return floor != null ? `€${floor.toFixed(2)} @${t.minQty}` : null;
                })
                .filter(Boolean)
                .join(" · ")}
              ) · ต้นทุน SSB €1 จาก 250
            </p>
          ) : null}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ขั้น</TableHead>
                  <TableHead className="text-right">เว็บ (THB)</TableHead>
                  <TableHead className="text-right">ต้นทุน (THB)</TableHead>
                  <TableHead className="text-right">ค่าส่ง/เมล็ด</TableHead>
                  <TableHead className="text-right">Landed (THB)</TableHead>
                  <TableHead className="text-right">ขาย B2B (THB)</TableHead>
                  <TableHead className="text-right">GM</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {row.label}
                        {row.draft ? (
                          <span className="ml-2 text-[10px] font-normal uppercase text-amber-700">
                            draft
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-slate-500">{row.qtyDescription}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {row.publicThb != null ? (
                        <DualMoney thbValue={row.publicThb} eurValue={row.publicEur} thbDigits={0} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <DualMoney thbValue={row.costThb} eurValue={row.costEur} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {row.freightPerSeedThb > 0 ? thb(row.freightPerSeedThb) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {thb(row.landedThb)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      <DualMoney thbValue={row.sellThb} eurValue={row.sellEur} thbDigits={0} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {fmt(row.gmPct, 0)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {fmt(row.markupPct, 0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <GfStrainCatalogPanel />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <SgStrainCatalogPanel />
        </CardContent>
      </Card>

      <BulkShareLeadsPanel />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ลิงก์ exclusive ถึงลูกค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            ลูกค้าเห็นเฉพาะเรทขายและรายการสายพันธุ์ — ไม่เห็นต้นทุน / landed / GM
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">หัวข้อบนหน้าลูกค้า</Label>
              <Input value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">อายุลิงก์ (วัน)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={shareDays}
                onChange={(e) => setShareDays(Number(e.target.value) || 14)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {BULK_SUPPLIER_BOOKS.map((book) => (
              <label key={book.slug} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shareSuppliers.includes(book.slug)}
                  onChange={() => toggleSupplier(book.slug)}
                />
                {book.name}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showStrains}
                onChange={(e) => setShowStrains(e.target.checked)}
              />
              โชว์รายการสายพันธุ์ (GF + SG)
            </label>
          </div>
          <Button type="button" onClick={() => void mintLink()} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-1.5 h-4 w-4" />
            )}
            สร้างและคัดลอกลิงก์
          </Button>
          {link ? (
            <p className="break-all font-mono text-xs text-slate-600">
              <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-700" />
              {link}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
