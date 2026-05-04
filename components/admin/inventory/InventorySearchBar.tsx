"use client";

import type { RefObject } from "react";
import { Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InventorySearchBar({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-1">
      <Label>ค้นหา</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          ref={inputRef}
          placeholder="ค้นหาชื่อสายพันธุ์ หรือ SKU..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-[220px] rounded-md border-zinc-200 pl-8 pr-9 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {value.trim() !== "" && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-zinc-400 transition hover:text-primary focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => {
              onChange("");
              queueMicrotask(() => inputRef?.current?.focus());
            }}
          >
            <XCircle className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
