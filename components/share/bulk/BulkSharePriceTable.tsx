"use client";

import { pickTierForQty, type SerializedPricedBook } from "@/lib/bulk-share-order";
import { SEEDS_GENETICS_SLUG, type BulkPricedTier } from "@/lib/bulk-seeds-book";
import { SGF_SEEDS_SHARE_TAGLINE } from "@/lib/sgf-seeds-share";
import {
  BULK_SHARE_COPY,
  localizeQtyDescription,
  type BulkShareLang,
} from "@/lib/bulk-share-i18n";

type PriceRow = SerializedPricedBook["rows"][number];

type Props = {
  book: SerializedPricedBook;
  lang: BulkShareLang;
  cartSeedCount?: number;
};

const SGF_VOLUME_MIN = 2500;

function fmtThb(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `฿${Math.ceil(n).toLocaleString("en-US")}`;
}

function fmtEur(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function rowByMinQty(rows: PriceRow[], minQty: number): PriceRow | undefined {
  return rows.find((r) => r.minQty === minQty);
}

function sgfPrimaryRows(rows: PriceRow[], lang: BulkShareLang): PriceRow[] {
  const starter = rowByMinQty(rows, 50);
  const moq = rowByMinQty(rows, 250);
  const bulk = rowByMinQty(rows, 500) ?? rowByMinQty(rows, 1000);
  const t = BULK_SHARE_COPY[lang];
  const out: PriceRow[] = [];
  if (starter) {
    out.push({
      ...starter,
      qtyDescription: lang === "th" ? "50–249 เมล็ด / สาย" : "50–249 seeds / strain",
    });
  }
  if (moq) {
    out.push({
      ...moq,
      qtyDescription: lang === "th" ? "250–499 เมล็ด / สาย" : "250–499 seeds / strain",
    });
  }
  if (bulk) {
    out.push({
      ...bulk,
      label: lang === "th" ? "วอลุ่ม" : "Volume",
      qtyDescription: lang === "th" ? "500–1,000 เมล็ด / สาย" : "500–1,000 seeds / strain",
    });
  }
  return out;
}

function tierMatchesHighlight(row: PriceRow, activeMinQty: number | null): boolean {
  return activeMinQty != null && row.minQty === activeMinQty;
}

export function BulkSharePriceTable({ book, lang, cartSeedCount = 0 }: Props) {
  const t = BULK_SHARE_COPY[lang];
  const isSgf = book.supplierSlug === "green-future";
  const sorted = [...book.rows].sort((a, b) => a.minQty - b.minQty);
  const activeTier =
    cartSeedCount >= 50
      ? pickTierForQty(sorted as BulkPricedTier[], cartSeedCount)
      : null;
  const activeMinQty = activeTier?.minQty ?? null;

  const primaryRows = isSgf ? sgfPrimaryRows(sorted, lang) : sorted.filter((r) => r.minQty < SGF_VOLUME_MIN);
  const volumeRows = isSgf ? sorted.filter((r) => r.minQty >= SGF_VOLUME_MIN) : [];

  function renderRow(row: PriceRow, highlight: boolean) {
    return (
      <tr
        key={`${row.minQty}-${row.label}`}
        className={
          highlight
            ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30"
            : "border-b border-border/60 last:border-0"
        }
      >
        <td className="px-3 py-3 sm:px-4">
          <p className="text-sm font-medium text-foreground">{row.label}</p>
          <p className="text-xs text-muted-foreground">
            {localizeQtyDescription(row.qtyDescription, lang)}
          </p>
        </td>
        <td className="px-3 py-3 text-right sm:px-4">
          <p className="font-mono text-base font-semibold text-emerald-400">{fmtThb(row.sellThb)}</p>
          {row.sellEur > 0 ? (
            <p className="font-mono text-[11px] text-muted-foreground">{fmtEur(row.sellEur)}</p>
          ) : null}
        </td>
      </tr>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-slate-900/40 shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{book.supplierLabel}</h2>
        {isSgf ? (
          <>
            <p className="mt-1 text-xs text-muted-foreground">{SGF_SEEDS_SHARE_TAGLINE}</p>
            <p className="text-xs text-muted-foreground">{t.sgfFormats}</p>
          </>
        ) : null}
        {book.supplierSlug === SEEDS_GENETICS_SLUG ? (
          <p className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-medium leading-snug text-sky-100">
            {t.sgImportNote}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 font-medium sm:px-4">{t.qtyCol}</th>
              <th className="px-3 py-2.5 text-right font-medium sm:px-4">{t.priceCol}</th>
            </tr>
          </thead>
          <tbody>
            {primaryRows.map((row) => {
              const highlight = isSgf
                ? (activeMinQty != null &&
                    ((row.minQty === 50 && activeMinQty < 250) ||
                      (row.minQty === 250 && activeMinQty >= 250 && activeMinQty < 500) ||
                      (row.minQty === 500 && activeMinQty >= 500 && activeMinQty < 2500)))
                : tierMatchesHighlight(row, activeMinQty);
              return renderRow(row, Boolean(highlight));
            })}
          </tbody>
        </table>
      </div>
      {volumeRows.length > 0 ? (
        <details className="border-t border-border">
          <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            {t.highVolumeTiers}
          </summary>
          <table className="w-full text-sm">
            <tbody>
              {volumeRows.map((row) =>
                renderRow(row, tierMatchesHighlight(row, activeMinQty))
              )}
            </tbody>
          </table>
        </details>
      ) : null}
    </section>
  );
}
