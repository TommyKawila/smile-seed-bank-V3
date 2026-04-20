"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type ProductHit = {
  id: number;
  name: string;
  href: string;
  thumb: string | null;
  thcPercent: number | null;
  strainType: string | null;
};

type BreederHit = {
  id: number;
  name: string;
  href: string;
  logoUrl: string | null;
};

type SuggestResponse = { products: ProductHit[]; breeders: BreederHit[] };

type Row =
  | { kind: "product"; data: ProductHit }
  | { kind: "breeder"; data: BreederHit };

export function NavbarSearchPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setData(null);
      setHighlight(-1);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounced.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);

    fetch(`/api/storefront/search-suggest?q=${encodeURIComponent(debounced)}`, {
      signal: ac.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: SuggestResponse) => {
        if (!ac.signal.aborted) setData(json);
      })
      .catch(() => {
        if (!ac.signal.aborted) setData({ products: [], breeders: [] });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [debounced, open]);

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const p = data.products.map((d) => ({ kind: "product" as const, data: d }));
    const b = data.breeders.map((d) => ({ kind: "breeder" as const, data: d }));
    return [...p, ...b];
  }, [data]);

  const totalRows = rows.length;
  const showViewAllRow = totalRows > 0 && debounced.length >= 1;
  const maxIndex = totalRows === 0 ? -1 : showViewAllRow ? totalRows : totalRows - 1;

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      setDebounced("");
      setData(null);
      setHighlight(-1);
      router.push(href);
    },
    [onOpenChange, router]
  );

  const submitSearch = useCallback(() => {
    const q = query.trim();
    onOpenChange(false);
    setQuery("");
    setDebounced("");
    setData(null);
    setHighlight(-1);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }, [onOpenChange, query, router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (maxIndex < 0 ? -1 : h < maxIndex ? h + 1 : h));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? -1 : h - 1));
      return;
    }
    if (e.key === "Enter") {
      if (highlight >= 0 && highlight < totalRows) {
        e.preventDefault();
        const row = rows[highlight];
        go(row.kind === "product" ? row.data.href : row.data.href);
        return;
      }
      if (showViewAllRow && highlight === totalRows) {
        e.preventDefault();
        go(`/shop?q=${encodeURIComponent(debounced)}`);
        return;
      }
      submitSearch();
      return;
    }
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const empty =
    debounced.length >= 2 && !loading && data && data.products.length === 0 && data.breeders.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg border-zinc-200 bg-white/98 p-0 shadow-xl backdrop-blur-md sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("ค้นหา", "Search")}</DialogTitle>
        </DialogHeader>

        <div className="border-b border-zinc-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(-1);
              }}
              onKeyDown={onKeyDown}
              placeholder={t("ค้นหาสายพันธุ์หรือแบรนด์...", "Search strains or brands...")}
              className="h-11 border-zinc-200 bg-white pl-9 pr-3 text-base"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="search-suggest-list"
              aria-expanded={open && (totalRows > 0 || Boolean(empty))}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" className="flex-1 bg-primary text-white hover:bg-primary/90" onClick={submitSearch}>
              {t("ค้นหา", "Search")}
            </Button>
          </div>
        </div>

        <div
          id="search-suggest-list"
          role="listbox"
          className="max-h-[min(60vh,420px)] overflow-y-auto px-2 pb-2"
        >
          {loading && debounced.length >= 2 && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              {t("กำลังค้นหา…", "Searching…")}
            </div>
          )}

          {!loading && debounced.length >= 2 && rows.map((row, i) => {
            const active = highlight === i;
            if (row.kind === "product") {
              const p = row.data;
              const subParts: string[] = [];
              if (p.thcPercent != null) subParts.push(`THC ${p.thcPercent}%`);
              if (p.strainType) subParts.push(p.strainType);
              const sub = subParts.join(" · ") || "—";
              return (
                <button
                  key={`p-${p.id}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
                    active ? "bg-emerald-50 ring-1 ring-emerald-200/80" : "hover:bg-zinc-50"
                  )}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => go(p.href)}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/80">
                    {p.thumb ? (
                      <Image src={p.thumb} alt="" fill className="object-cover" sizes="48px" unoptimized={!p.thumb.includes("supabase.co")} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-zinc-300">
                        <Leaf className="h-6 w-6" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-semibold text-zinc-900">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">{sub}</span>
                  </span>
                </button>
              );
            }
            const b = row.data;
            return (
              <button
                key={`b-${b.id}`}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
                  active ? "bg-emerald-50 ring-1 ring-emerald-200/80" : "hover:bg-zinc-50"
                )}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => go(b.href)}
              >
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/80">
                  {b.logoUrl ? (
                    <Image src={b.logoUrl} alt="" width={48} height={48} className="object-contain p-1" unoptimized={!b.logoUrl.includes("supabase.co")} />
                  ) : (
                    <Leaf className="h-6 w-6 text-zinc-300" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-semibold text-zinc-900">{b.name}</span>
                  <span className="mt-0.5 block text-xs font-medium text-emerald-800/90">
                    {t("บรีดเดอร์", "Breeder")}
                  </span>
                </span>
              </button>
            );
          })}

          {empty && (
            <div className="space-y-3 px-2 py-6 text-center">
              <p className="text-sm text-zinc-600">
                {t("ไม่พบผลลัพธ์ที่ตรงกัน — ลองคำค้นอื่น หรือดูสายพันธุ์ยอดนิยม", "No matches — try another term or explore popular picks.")}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <Link
                  href="/shop?thc=high"
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
                  onClick={() => onOpenChange(false)}
                >
                  {locale === "en" ? "High THC" : "THC สูง"}
                </Link>
                <Link
                  href="/shop?ft=auto"
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
                  onClick={() => onOpenChange(false)}
                >
                  {locale === "en" ? "Autoflower" : "ออโต้"}
                </Link>
                <Link
                  href="/shop"
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-900 hover:bg-emerald-100"
                  onClick={() => onOpenChange(false)}
                >
                  {t("ดูทั้งหมด", "Browse shop")}
                </Link>
              </div>
            </div>
          )}

          {!loading && debounced.length >= 2 && showViewAllRow && (
            <button
              type="button"
              role="option"
              aria-selected={highlight === totalRows}
              className={cn(
                "mt-1 w-full rounded-lg border border-dashed border-zinc-200 px-3 py-2.5 text-center text-sm font-medium transition-colors",
                highlight === totalRows
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "text-emerald-800 hover:bg-zinc-50"
              )}
              onMouseEnter={() => setHighlight(totalRows)}
              onClick={() => go(`/shop?q=${encodeURIComponent(debounced)}`)}
            >
              {t("ดูผลทั้งหมดสำหรับ", "View all results for")} &quot;{debounced}&quot;
            </button>
          )}

          {!loading && debounced.length > 0 && debounced.length < 2 && (
            <p className="px-2 py-4 text-center text-xs text-zinc-400">
              {t("พิมพ์อย่างน้อย 2 ตัวอักษร", "Type at least 2 characters")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
