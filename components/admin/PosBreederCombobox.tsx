"use client";

import { useMemo, useState, useRef, useLayoutEffect, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PosBreederOption = { id: number; name: string };

type Props = {
  breeders: PosBreederOption[];
  value: string;
  onChange: (breederId: string) => void;
  className?: string;
};

function matchesBreederQuery(b: PosBreederOption, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const name = b.name.toLowerCase();
  const id = String(b.id);
  return name.includes(q) || id.includes(q);
}

function matchesAllRowQuery(raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  if ("ทั้งหมด".includes(q) || "ทั้งหมด".toLowerCase().includes(q)) return true;
  return ["all", "breeder", "breeders"].some((k) => q.includes(k));
}

const itemClass =
  "pointer-events-auto cursor-pointer text-zinc-900 opacity-100 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100 aria-selected:bg-emerald-50 aria-selected:text-emerald-900";

export function PosBreederCombobox({ breeders, value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) setQuery("");
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
        return;
      }
      const el = document.querySelector<HTMLInputElement>(
        "[data-pos-breeder-command] input"
      );
      el?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const filteredBreeders = useMemo(
    () => breeders.filter((b) => matchesBreederQuery(b, query)),
    [breeders, query]
  );

  const showAllRow = matchesAllRowQuery(query);
  const noMatches = !showAllRow && filteredBreeders.length === 0;

  const selectedLabel = useMemo(() => {
    if (value === "all") return "ทั้งหมด";
    const b = breeders.find((x) => String(x.id) === value);
    return b?.name ?? null;
  }, [breeders, value]);

  const triggerText = selectedLabel ?? "เลือกค่ายเมล็ด… / Select Breeder…";

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="เลือกค่ายเมล็ด / Select breeder"
          className={cn(
            "h-11 w-full min-h-[44px] justify-between border-zinc-200 bg-white px-3 font-normal hover:border-emerald-400/50 hover:bg-zinc-50 focus:border-primary focus:ring-2 focus:ring-primary/25",
            !selectedLabel && "text-zinc-500",
            selectedLabel && "text-zinc-900",
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left text-sm">{triggerText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[110] w-[min(100vw-1.25rem,28rem)] max-w-none p-0 pointer-events-auto sm:w-[28rem]"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div data-pos-breeder-command="" className="pointer-events-auto">
          <Command
            shouldFilter={false}
            disablePointerSelection={false}
            className="rounded-md border-0 shadow-none"
          >
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="ค้นหาค่ายเมล็ด…"
              className="h-11 border-0"
              autoComplete="off"
            />
            <CommandList className="pointer-events-auto">
              <CommandGroup className="pointer-events-auto">
                {showAllRow && (
                  <CommandItem
                    value="pos-breeder-all"
                    keywords={["ทั้งหมด", "all", "breeders", "breeder"]}
                    onSelect={() => {
                      onChange("all");
                      setOpen(false);
                    }}
                    className={itemClass}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0 text-emerald-700",
                        value === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-zinc-900">ทั้งหมด</span>
                      <span className="ml-1.5 text-zinc-600">· All Breeders</span>
                    </span>
                  </CommandItem>
                )}
                {filteredBreeders.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`pos-breeder-${b.id}`}
                    keywords={[b.name, String(b.id)]}
                    onSelect={() => {
                      onChange(String(b.id));
                      setOpen(false);
                    }}
                    className={itemClass}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0 text-emerald-700",
                        value === String(b.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-zinc-900">{b.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {noMatches && (
                <p className="pointer-events-none px-3 py-6 text-center text-sm text-zinc-500">
                  ไม่พบค่ายที่ค้นหา
                </p>
              )}
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
