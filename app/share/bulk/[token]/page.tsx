import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { readBulkShareToken } from "@/lib/bulk-share-token";
import {
  BULK_SUPPLIER_BOOKS,
  SEED_FORMAT_LABEL,
  SEEDS_GENETICS_SLUG,
  priceSupplierBook,
  type BulkSupplierSlug,
} from "@/lib/bulk-seeds-book";
import { BulkShareSgStrains } from "@/components/share/bulk/BulkShareSgStrains";
import { sgStrainsGrouped } from "@/lib/seeds-genetics-catalog";
import { listPartnerStrains } from "@/services/partner-catalog-service";
import { GREEN_FUTURE_SLUG } from "@/types/partner-catalog";

export const dynamic = "force-dynamic";
export const robots = { index: false, follow: false };

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Bulk seed offer · Smile Seed Bank",
    robots: { index: false, follow: false },
  };
}

function fmtThb(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `฿${Math.ceil(n).toLocaleString("en-US")}`;
}

function fmtEur(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function BulkSharePage({ params }: Props) {
  const { token } = await params;
  const payload = readBulkShareToken(decodeURIComponent(token));
  if (!payload) notFound();

  const books = payload.suppliers
    .map((slug) => BULK_SUPPLIER_BOOKS.find((b) => b.slug === slug))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const priced = books.map((book) => ({
    book,
    rows: priceSupplierBook({
      book,
      eurThb: payload.eurThb,
      landedPct: payload.landed[book.slug] ?? book.recommendedLandedPct,
      gmOverride: payload.gmOverride,
    }),
  }));

  const strains =
    payload.showStrains && payload.suppliers.includes("green-future" as BulkSupplierSlug)
      ? (
          await withTimeout(
            listPartnerStrains(GREEN_FUTURE_SLUG, { limit: 200, offset: 0 }),
            4000,
            { strains: [], total: 0 }
          )
        ).strains
      : [];

  const showSgStrains =
    payload.showStrains &&
    payload.suppliers.includes(SEEDS_GENETICS_SLUG as BulkSupplierSlug);
  const sgGroups = showSgStrains ? sgStrainsGrouped() : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Exclusive offer
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {payload.title}
          </h1>
          <p className="text-sm text-slate-500">
            Smile Seed Bank · ราคาต่อเมล็ด (THB) ตามปริมาณ · ไม่รวมค่าขนส่งปลายทาง
          </p>
          <p className="text-xs text-slate-400">
            ลิงก์หมดอายุ {new Date(payload.exp).toLocaleDateString("th-TH")}
          </p>
        </header>

        {priced.map(({ book, rows }) => (
          <section key={book.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">{book.name}</h2>
              <p className="text-xs text-slate-500">{book.origin}</p>
              {book.slug === SEEDS_GENETICS_SLUG ? (
                <p className="mt-1 text-xs text-slate-500">
                  ราคารวมบริการนำเข้า — สูงกว่า bulk สาธารณะของ Seeds Genetics เล็กน้อย
                </p>
              ) : null}
              {book.formats.length > 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  {book.formats.map((f) => SEED_FORMAT_LABEL[f]).join(" · ")}
                  {book.strainListPending ? " · ลิสต์สายพันธุ์จะแจ้งภายหลัง" : ""}
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
                {rows.map((row) => (
                  <tr key={row.code} className="border-b border-slate-50 last:border-0">
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

        {strains.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">สายพันธุ์ (Green Future)</h2>
            <p className="mt-1 text-xs text-slate-500">{strains.length} รายการ</p>
            <ul className="mt-3 columns-1 gap-x-6 text-sm text-slate-700 sm:columns-2">
              {strains.map((s) => (
                <li key={s.id} className="mb-1 break-inside-avoid">
                  <span className="font-mono text-[11px] text-slate-400">{s.varietyCode}</span>{" "}
                  {s.strainName}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {sgGroups.length > 0 ? <BulkShareSgStrains groups={sgGroups} /> : null}

        <p className="text-center text-[11px] text-slate-400">
          Confidential · not for public listing · Smile Seed Bank
        </p>
      </div>
    </main>
  );
}
