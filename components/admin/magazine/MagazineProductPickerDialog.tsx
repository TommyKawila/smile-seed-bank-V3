"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Package, Search } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type MagazineProductRow = {
  id: number;
  name: string;
  slug: string | null;
  image_url: string | null;
  breeder_name: string | null;
  price: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single-select (e.g. TipTap insert) */
  onSelect?: (p: MagazineProductRow) => void;
  multiSelect?: {
    selectedIds: number[];
    onToggle: (p: MagazineProductRow) => void;
  };
  title?: string;
};

export function MagazineProductPickerDialog({
  open,
  onOpenChange,
  onSelect,
  multiSelect,
  title = "Choose product",
}: Props) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [list, setList] = useState<MagazineProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const url = debounced
      ? `/api/admin/magazine/products?q=${encodeURIComponent(debounced)}&limit=40`
      : "/api/admin/magazine/products?limit=40";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setList(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debounced]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setDebounced("");
    }
  }, [open]);

  const selectedSet = useMemo(
    () => new Set(multiSelect?.selectedIds ?? []),
    [multiSelect?.selectedIds]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl">
        <DialogHeader className="border-b border-zinc-200 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <Package className="h-4 w-4 text-emerald-800" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="border-b border-zinc-200 px-4 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or slug…"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-700/40 focus:outline-none focus:ring-1 focus:ring-emerald-700/25"
            />
          </div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto px-2 pb-4">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-800/50" />
            </div>
          )}
          {!loading && list.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-500">No products found</p>
          )}
          <ul className="space-y-1">
            {list.map((p) => {
              const multi = multiSelect != null;
              const isOn = selectedSet.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (multi) {
                        multiSelect.onToggle(p);
                      } else {
                        onSelect?.(p);
                        onOpenChange(false);
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                      multi && isOn
                        ? "bg-emerald-50 ring-1 ring-emerald-700/30"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized={!p.image_url.includes("supabase.co")}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                      {p.breeder_name && (
                        <p className="truncate text-xs text-zinc-500">{p.breeder_name}</p>
                      )}
                    </div>
                    {multi && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isOn ? "bg-emerald-800 text-white" : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {isOn ? "Added" : "Add"}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
