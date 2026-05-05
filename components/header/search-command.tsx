"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Leaf, Search, Tag, Users } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useBreeders } from "@/hooks/useBreeders";
import { cn } from "@/lib/utils";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

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

const DIALOG_CONTENT =
  "translate-y-0 flex max-h-[min(90dvh,720px)] w-[calc(100vw-1.25rem)] max-w-lg flex-col gap-0 overflow-hidden border border-zinc-200 bg-white px-0 pb-0 pt-10 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 sm:max-w-xl";

const COMMAND_SHELL =
  "[--cmd-radius:0.75rem] rounded-[var(--cmd-radius)] bg-white dark:bg-zinc-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-zinc-500 dark:[&_[cmdk-group-heading]]:text-zinc-400";

const ITEM_ROW =
  "aria-selected:bg-emerald-100/90 aria-selected:text-emerald-950 dark:aria-selected:bg-emerald-900/50 dark:aria-selected:text-emerald-50";

/** Fixed block height for suggest API zone — skeleton / error / empty share this to limit CLS */
const SUGGEST_ZONE_MIN_H = "min-h-[15rem]";

const SUGGEST_SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5"] as const;

export function SearchCommand({
  open,
  onOpenChange,
  triggerClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra classes for the icon trigger button */
  triggerClassName?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { breeders } = useBreeders();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestFetchError, setSuggestFetchError] = useState(false);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!openRef.current);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setData(null);
      setSuggestFetchError(false);
      setIsLoading(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || debounced.length < 2) {
      setData(null);
      setSuggestFetchError(false);
      setIsLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setSuggestFetchError(false);
    setIsLoading(true);
    fetch(`/api/storefront/search-suggest?q=${encodeURIComponent(debounced)}`, {
      signal: ac.signal,
    })
      .then(async (r) => {
        if (ac.signal.aborted) return;
        if (!r.ok) {
          setSuggestFetchError(true);
          setData(null);
          return;
        }
        const json = (await r.json()) as SuggestResponse;
        if (!ac.signal.aborted) {
          setSuggestFetchError(false);
          setData({
            products: Array.isArray(json?.products) ? json.products : [],
            breeders: Array.isArray(json?.breeders) ? json.breeders : [],
          });
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setSuggestFetchError(true);
          setData(null);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setIsLoading(false);
      });
    return () => ac.abort();
  }, [debounced, open]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      setDebounced("");
      setData(null);
      setSuggestFetchError(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  const submitCatalogSearch = useCallback(() => {
    const q = query.trim();
    onOpenChange(false);
    setQuery("");
    setDebounced("");
    setData(null);
    setSuggestFetchError(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }, [onOpenChange, query, router]);

  const sortedBreeders = useMemo(
    () => [...breeders].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 14),
    [breeders]
  );

  const hasSuggest =
    debounced.length >= 2 &&
    !suggestFetchError &&
    data &&
    (data.products.length > 0 || data.breeders.length > 0);
  const suggestEmpty =
    debounced.length >= 2 &&
    !isLoading &&
    !suggestFetchError &&
    data &&
    data.products.length === 0 &&
    data.breeders.length === 0;

  const title = t("ค้นหาและนำทาง", "Search & navigate");

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
          triggerClassName
        )}
        aria-label={t("เปิดการค้นหา", "Open search")}
      >
        <Search className="h-5 w-5 text-zinc-800 dark:text-zinc-100" />
        <kbd className="pointer-events-none absolute -bottom-1 left-1/2 hidden -translate-x-1/2 translate-y-full rounded border border-zinc-200 bg-zinc-50 px-1 font-mono text-[9px] text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 sm:block">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(DIALOG_CONTENT, "fixed left-1/2 top-[max(1rem,min(15dvh,3rem))] z-50 translate-x-[-50%] translate-y-0 sm:top-[12%]")}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <Command
            className={cn(COMMAND_SHELL, ITEM_ROW)}
            shouldFilter={debounced.length < 2 || !isLoading}
            loop
          >
            <CommandInput
              placeholder={t("ค้นหาสายพันธุ์ แบรนด์ หรือเลือกทางลัด…", "Search strains, brands, or pick a shortcut…")}
              value={query}
              onValueChange={setQuery}
              className="h-12 border-0 text-base text-zinc-950 placeholder:text-zinc-400 dark:text-zinc-50"
            />
            <CommandList
              className={cn(
                "max-h-[min(60dvh,22rem)] overflow-x-hidden overscroll-contain sm:max-h-[min(55dvh,24rem)]",
                debounced.length >= 2 && "scroll-smooth transition-[min-height] duration-200 ease-out"
              )}
            >
              {debounced.length >= 2 && (
                <div
                  className={cn(
                    SUGGEST_ZONE_MIN_H,
                    "border-b border-zinc-100 px-2 pb-2 dark:border-zinc-800"
                  )}
                  aria-busy={isLoading || undefined}
                >
                  {isLoading && (
                    <div className="space-y-2.5 pt-1" role="status" aria-live="polite">
                      <p className="sr-only">{t("กำลังโหลดคำแนะนำ", "Loading suggestions")}</p>
                      {SUGGEST_SKELETON_KEYS.map((key) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 rounded-lg py-1.5"
                        >
                          <Skeleton className="h-11 w-11 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                          <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
                            <Skeleton className="h-4 w-[88%] max-w-md rounded bg-zinc-200 dark:bg-zinc-800" />
                            <Skeleton className="h-3 w-[40%] max-w-[11rem] rounded bg-zinc-200 dark:bg-zinc-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoading && suggestFetchError && (
                    <div
                      className="flex min-h-[12rem] flex-col items-center justify-center px-2 py-6 text-center"
                      role="status"
                    >
                      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {t("โหลดคำแนะนำไม่สำเร็จ", "Unable to load suggestions")}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {t("ยังค้นหาในร้านหรือใช้ทางลัดด้านล่างได้", "You can still search the shop or use shortcuts below.")}
                      </p>
                    </div>
                  )}

                  {hasSuggest && (
                    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
                  {data!.products.length > 0 && (
                    <CommandGroup
                      heading={t("สินค้า", "Products")}
                      className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-1.5"
                    >
                      {data!.products.map((p) => (
                        <CommandItem
                          key={`p-${p.id}`}
                          value={`product ${p.name} ${p.strainType ?? ""}`}
                          onSelect={() => go(p.href)}
                          className="flex cursor-pointer items-center gap-3 py-2.5"
                        >
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                            {p.thumb ? (
                              <Image
                                src={p.thumb}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="44px"
                                unoptimized={shouldOffloadImageOptimization(p.thumb)}
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-zinc-300">
                                <Leaf className="h-5 w-5" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium">{p.name}</span>
                            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                              {[p.thcPercent != null ? `THC ${p.thcPercent}%` : null, p.strainType]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {data!.breeders.length > 0 && (
                    <CommandGroup heading={t("แบรนด์ที่ตรงกัน", "Matching breeders")}>
                      {data!.breeders.map((b) => (
                        <CommandItem
                          key={`sb-${b.id}`}
                          value={`breeder suggest ${b.name}`}
                          onSelect={() => go(b.href)}
                          className="cursor-pointer gap-2 py-2.5"
                        >
                          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                            {b.logoUrl ? (
                              <Image
                                src={b.logoUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="object-contain p-1"
                                unoptimized={shouldOffloadImageOptimization(b.logoUrl)}
                              />
                            ) : (
                              <Users className="h-4 w-4 text-zinc-400" />
                            )}
                          </span>
                          <span className="font-medium">{b.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  <CommandSeparator className="my-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  )}

                  {suggestEmpty && (
                    <div className="flex min-h-[10rem] flex-col items-center justify-center px-2 py-5 text-center">
                      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {t(
                          "ไม่พบผลลัพธ์จากการค้นหา — ใช้เมนูด้านบนหรือลองคำอื่น",
                          "No search hits — use shortcuts above or try another term."
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <CommandGroup
                heading={t("แนะนำ", "Recommended")}
                className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-1.5"
              >
                <CommandItem
                  value={`promotions deals shop smart ${t("โปรโมชันและดีล", "Promotions & deals")}`}
                  onSelect={() => go("/shop")}
                  className="cursor-pointer gap-2 py-2.5"
                >
                  <Flame className="h-4 w-4 shrink-0 text-orange-500" />
                  <span>{t("โปรโมชันและดีล", "Promotions & deals")}</span>
                </CommandItem>
                <CommandItem
                  value={`best sellers seeds category popular ${t("สายพันธุ์ยอดนิยม", "Popular strains")}`}
                  onSelect={() => go("/shop?category=Seeds")}
                  className="cursor-pointer gap-2 py-2.5"
                >
                  <Flame className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{t("สายพันธุ์ยอดนิยม", "Popular strains")}</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator className="my-1 bg-zinc-200 dark:bg-zinc-800" />

              <CommandGroup
                heading={t("บรีดเดอร์", "Breeders")}
                className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-1.5"
              >
                {sortedBreeders.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`breeder ${b.name}`}
                    onSelect={() => go(seedsBreederHref(b))}
                    className="cursor-pointer gap-2 py-2.5"
                  >
                    <Users className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium">{b.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator className="my-1 bg-zinc-200 dark:bg-zinc-800" />

              <CommandGroup
                heading={t("ประเภทเมล็ด", "Seed types")}
                className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-1.5"
              >
                <CommandItem
                  value={`autoflower auto ${t("ออโต้", "Autoflower")}`}
                  onSelect={() => go("/seeds?ft=auto")}
                  className="cursor-pointer gap-2 py-2.5"
                >
                  <Tag className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("ออโต้ฟลาวเวอร์", "Autoflower")}</span>
                </CommandItem>
                <CommandItem
                  value={`feminized fem seeds ${t("เมล็ดเมีย", "Feminized")}`}
                  onSelect={() => go("/seeds?sex=feminized")}
                  className="cursor-pointer gap-2 py-2.5"
                >
                  <Tag className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                  <span>{t("เมล็ดเมีย (Feminized)", "Feminized seeds")}</span>
                </CommandItem>
                <CommandItem
                  value={`photoperiod photo ${t("โฟโต้", "Photoperiod")}`}
                  onSelect={() => go("/seeds?ft=photo")}
                  className="cursor-pointer gap-2 py-2.5"
                >
                  <Tag className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>{t("โฟโต้พีริออด (Photo)", "Photoperiod")}</span>
                </CommandItem>
              </CommandGroup>

              <CommandEmpty className="py-6 text-zinc-500 dark:text-zinc-400">
                {t("ไม่มีรายการที่ตรงกัน", "No matching items")}
              </CommandEmpty>
            </CommandList>

            <div className="flex flex-col gap-2 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t("ทางลัด: ⌘K หรือ Ctrl+K · Esc ปิด", "Shortcuts: ⌘K or Ctrl+K · Esc to close")}
              </p>
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={submitCatalogSearch}
              >
                {t("ค้นหาในร้านทั้งหมด", "Search full catalog")}
                {query.trim() ? ` — “${query.trim()}”` : ""}
              </button>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
