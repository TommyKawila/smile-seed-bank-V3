"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import type { MagazineProductRow } from "./MagazineProductPickerDialog";
import { MagazineProductPickerDialog } from "./MagazineProductPickerDialog";

export function RelatedProductsSection({
  selectedIds,
  onChange,
}: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (selectedIds.length === 0) {
      setLabels(new Map());
      return;
    }
    let cancelled = false;
    fetch(`/api/admin/magazine/products?ids=${selectedIds.join(",")}`)
      .then((r) => r.json())
      .then((rows: { id: number; name: string }[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        const m = new Map<number, string>();
        rows.forEach((row) => m.set(row.id, row.name));
        setLabels(m);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedIds.join(",")]);

  const remove = (id: number) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const toggle = (p: MagazineProductRow) => {
    const has = selectedIds.includes(p.id);
    if (has) onChange(selectedIds.filter((x) => x !== p.id));
    else onChange([...selectedIds, p.id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Related products
          </label>
          <p className="mt-1 text-xs text-zinc-600">
            Shop the Story — pick strains to feature below the article.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-emerald-600/50 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add products
        </button>
      </div>

      {selectedIds.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <li
              key={id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-200"
            >
              <span className="truncate">{labels.get(id) ?? `Product #${id}`}</span>
              <button
                type="button"
                onClick={() => remove(id)}
                className="shrink-0 rounded-full p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <MagazineProductPickerDialog
        open={open}
        onOpenChange={setOpen}
        multiSelect={{ selectedIds, onToggle: toggle }}
        title="Related products (Shop the Story)"
      />
    </div>
  );
}
