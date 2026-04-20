"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  PackageX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductModal } from "@/components/admin/ProductModal";
import { ProductTableRow } from "@/components/admin/ProductTableRow";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProductListItem } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";
import { FLOWERING_DB_PHOTO_3N } from "@/lib/constants";

const STRAIN_DOMINANCE_OPTIONS = ["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"] as const;

type ImageFilter = "all" | "true" | "false";
type StatusFilter = "all" | "true" | "false";
type StockFilter = "all" | "inStock" | "outOfStock";

function parseImageFilter(raw: string | null): ImageFilter {
  if (raw === "true" || raw === "false") return raw;
  return "all";
}

function parseStatusFilter(raw: string | null): StatusFilter {
  if (raw === "true" || raw === "false") return raw;
  return "all";
}

function parseStockFilter(raw: string | null): StockFilter {
  if (raw === "inStock" || raw === "outOfStock") return raw;
  return "all";
}

function paginationButtons(current: number, total: number): (number | "gap")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const want = new Set<number>([1, total, current, current - 1, current + 1]);
  for (let n = current - 2; n <= current + 2; n++) {
    if (n >= 1 && n <= total) want.add(n);
  }
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("gap");
    out.push(n);
  }
  return out;
}

function lacksMainImage(p: { image_url?: string | null }) {
  return !p.image_url?.trim();
}

function ProductsTableSkeleton({ featuredMode }: { featuredMode: boolean }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="w-10 pr-0">
            <Skeleton className="h-4 w-4 rounded" />
          </TableCell>
          <TableCell className="align-middle">
            <Skeleton className="h-12 w-12 rounded-lg" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[min(100%,12rem)] max-w-full rounded-md" />
          </TableCell>
          {featuredMode && (
            <TableCell>
              <Skeleton className="h-8 w-14 rounded-md" />
            </TableCell>
          )}
          <TableCell>
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 max-w-full rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28 max-w-full rounded-md" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16 rounded-md" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-10 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-14 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function ProductsEmptyState({
  hasSearch,
  featuredOnly,
}: {
  hasSearch: boolean;
  featuredOnly: boolean;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={featuredOnly ? 12 : 11} className="p-0">
        <EmptyState
          icon={PackageX}
          title={
            hasSearch
              ? "ไม่พบสินค้าที่ค้นหา"
              : featuredOnly
                ? "ยังไม่มีสินค้าแนะนำ"
                : "ยังไม่มีสินค้า"
          }
          description={
            hasSearch
              ? "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง"
              : featuredOnly
                ? "เปิดแก้ไขสินค้าแล้วตั้งค่า Featured หรือสลับไปแท็บรายการทั้งหมด"
                : "เริ่มต้นด้วยการเพิ่มสินค้าใหม่จากปุ่มด้านบน"
          }
        />
      </TableCell>
    </TableRow>
  );
}

export default function ProductsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkPending, setBulkPending] = useState(false);

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const [breederId, setBreederId] = useState(() => searchParams.get("breeder") ?? "");
  const [categoryId, setCategoryId] = useState(() => searchParams.get("category") ?? "all");
  const [dominance, setDominance] = useState(() => searchParams.get("dominance") ?? "all");
  const [imageFilter, setImageFilter] = useState<ImageFilter>(() =>
    parseImageFilter(searchParams.get("hasImage"))
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusFilter(searchParams.get("isActive"))
  );
  const [stockFilter, setStockFilter] = useState<StockFilter>(() =>
    parseStockFilter(searchParams.get("stockStatus"))
  );

  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const featuredOnly = searchParams.get("view") === "featured";

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingAllIds, setFetchingAllIds] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      if (featuredOnly) params.set("view", "featured");
      if (breederId) params.set("breeder", breederId);
      if (categoryId !== "all") params.set("category", categoryId);
      if (dominance !== "all") params.set("dominance", dominance);
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      if (imageFilter !== "all") params.set("hasImage", imageFilter);
      if (statusFilter !== "all") params.set("isActive", statusFilter);
      if (stockFilter !== "all") params.set("stockStatus", stockFilter);
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = (await res.json()) as {
        error?: string;
        products?: ProductListItem[];
        totalCount?: number;
        totalPages?: number;
        currentPage?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setProducts(data.products ?? []);
      setTotalCount(data.totalCount ?? 0);
      setTotalPages(data.totalPages ?? 1);
      if (typeof data.currentPage === "number") setCurrentPage(data.currentPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    featuredOnly,
    breederId,
    categoryId,
    dominance,
    debouncedSearch,
    imageFilter,
    statusFilter,
    stockFilter,
  ]);

  useLayoutEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    breederId,
    categoryId,
    dominance,
    featuredOnly,
    pageSize,
    imageFilter,
    statusFilter,
    stockFilter,
  ]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const refetch = useCallback(() => {
    void loadProducts();
  }, [loadProducts]);

  const setListView = useCallback(
    (mode: "all" | "featured") => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "featured") params.set("view", "featured");
      else params.delete("view");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductFull | null>(null);

  const openAdd = () => {
    setEditProduct(null);
    setModalOpen(true);
  };
  const openEdit = (p: ProductFull) => {
    setEditProduct(p);
    setModalOpen(true);
  };

  const pageIds = useMemo(() => products.map((p) => p.id as number), [products]);

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    debouncedSearch,
    breederId,
    categoryId,
    dominance,
    featuredOnly,
    pageSize,
    imageFilter,
    statusFilter,
    stockFilter,
  ]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageSelected, pageIds]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectNoImageRows = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      products.filter(lacksMainImage).forEach((p) => next.add(p.id as number));
      return next;
    });
  }, [products]);

  const selectZeroStockRows = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      products.filter((p) => (p.stock ?? 0) === 0).forEach((p) => next.add(p.id as number));
      return next;
    });
  }, [products]);

  const selectAllMatchingFilter = useCallback(async () => {
    setFetchingAllIds(true);
    try {
      const params = new URLSearchParams();
      params.set("idsOnly", "1");
      if (featuredOnly) params.set("view", "featured");
      if (breederId) params.set("breeder", breederId);
      if (categoryId !== "all") params.set("category", categoryId);
      if (dominance !== "all") params.set("dominance", dominance);
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      if (imageFilter !== "all") params.set("hasImage", imageFilter);
      if (statusFilter !== "all") params.set("isActive", statusFilter);
      if (stockFilter !== "all") params.set("stockStatus", stockFilter);
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = (await res.json()) as { ids?: number[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดรายการไม่สำเร็จ");
      setSelectedIds(new Set(data.ids ?? []));
    } catch (e) {
      toast({
        variant: "destructive",
        title: "ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setFetchingAllIds(false);
    }
  }, [
    featuredOnly,
    breederId,
    categoryId,
    dominance,
    debouncedSearch,
    imageFilter,
    statusFilter,
    stockFilter,
    toast,
  ]);

  const runBulkStatus = useCallback(
    async (is_active: boolean) => {
      if (selectedIds.size === 0) return;
      setBulkPending(true);
      try {
        const res = await fetch("/api/admin/products/bulk-status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [...selectedIds], is_active }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          updated?: number;
          couldNotActivateCount?: number;
        };
        if (!res.ok) throw new Error(data.error ?? "อัปเดตไม่สำเร็จ");
        const extra =
          is_active && (data.couldNotActivateCount ?? 0) > 0
            ? ` (${data.couldNotActivateCount} รายการยังปิดอยู่เพราะไม่มีสต็อก)`
            : "";
        toast({
          title: "อัปเดตสถานะแล้ว",
          description: `ปรับ ${data.updated ?? selectedIds.size} รายการ${extra}`,
        });
        setSelectedIds(new Set());
        refetch();
      } catch (e) {
        toast({
          variant: "destructive",
          title: "ไม่สำเร็จ",
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setBulkPending(false);
      }
    },
    [selectedIds, refetch, toast]
  );

  useEffect(() => {
    setBreederId(searchParams.get("breeder") ?? "");
    setCategoryId(searchParams.get("category") ?? "all");
    setDominance(searchParams.get("dominance") ?? "all");
    setImageFilter(parseImageFilter(searchParams.get("hasImage")));
    setStatusFilter(parseStatusFilter(searchParams.get("isActive")));
    setStockFilter(parseStockFilter(searchParams.get("stockStatus")));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    else params.delete("q");
    if (breederId) params.set("breeder", breederId);
    else params.delete("breeder");
    if (categoryId !== "all") params.set("category", categoryId);
    else params.delete("category");
    if (dominance !== "all") params.set("dominance", dominance);
    else params.delete("dominance");
    if (imageFilter !== "all") params.set("hasImage", imageFilter);
    else params.delete("hasImage");
    if (statusFilter !== "all") params.set("isActive", statusFilter);
    else params.delete("isActive");
    if (stockFilter !== "all") params.set("stockStatus", stockFilter);
    else params.delete("stockStatus");

    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;

    const href = next ? `${pathname}?${next}` : pathname;
    router.replace(href, { scroll: false });
  }, [
    debouncedSearch,
    breederId,
    categoryId,
    dominance,
    imageFilter,
    statusFilter,
    stockFilter,
    pathname,
    router,
    searchParams,
  ]);

  const fetchBreeders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/breeders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBreeders(
            data
              .filter((b: { id?: unknown; name?: string }) => b.id != null && b.name)
              .map((b: { id: number; name: string }) => ({ id: Number(b.id), name: String(b.name) }))
          );
        }
      }
    } catch {
      setBreeders([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(
            data.map((c: { id: string; name: string }) => ({ id: String(c.id), name: c.name }))
          );
        }
      }
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchBreeders();
    fetchCategories();
  }, [fetchBreeders, fetchCategories]);

  return (
    <div
      className={cn(
        "space-y-5",
        JOURNAL_PRODUCT_FONT_VARS,
        selectedIds.size > 0 && "pb-24"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการสินค้า</h1>
          <p className="text-sm text-zinc-500">
            {totalCount} รายการ
            {totalPages > 1 ? ` · หน้า ${currentPage}/${totalPages}` : ""}
            {featuredOnly ? (
              <span className="ml-2 font-[family-name:var(--font-journal-product-mono)] text-xs text-emerald-800">
                Featured view · reorder via Priority
              </span>
            ) : null}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าใหม่
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={!featuredOnly ? "default" : "outline"}
          size="sm"
          className={!featuredOnly ? "bg-emerald-800 hover:bg-emerald-900" : ""}
          onClick={() => setListView("all")}
        >
          ทั้งหมด
        </Button>
        <Button
          type="button"
          variant={featuredOnly ? "default" : "outline"}
          size="sm"
          className={featuredOnly ? "bg-emerald-800 hover:bg-emerald-900" : ""}
          onClick={() => setListView("featured")}
        >
          แนะนำ (Featured)
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">กรอง</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">แบรนด์</Label>
            <Select value={breederId || "all"} onValueChange={(v) => setBreederId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {breeders.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">หมวดหมู่</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value={FLOWERING_DB_PHOTO_3N}>Photo 3N</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ประเภทพันธุกรรม</Label>
            <Select value={dominance} onValueChange={setDominance}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {STRAIN_DOMINANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">สถานะรูปภาพ</Label>
            <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 font-sans">
              {(
                [
                  { v: "all" as const, label: "ทั้งหมด" },
                  { v: "true" as const, label: "มีรูปภาพ" },
                  { v: "false" as const, label: "ไม่มีรูปภาพ" },
                ] as const
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setImageFilter(v)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                    imageFilter === v
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {v === "false" && imageFilter === "false" ? (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-100" aria-hidden />
                  ) : null}
                  {label}
                  {v === "false" && imageFilter === "false" ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-300" aria-hidden />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">สถานะการขาย</Label>
            <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 font-sans">
              {(
                [
                  { v: "all" as const, label: "ทั้งหมด" },
                  { v: "true" as const, label: "เปิดขาย" },
                  { v: "false" as const, label: "ปิดขาย" },
                ] as const
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStatusFilter(v)}
                  className={cn(
                    "rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === v
                      ? v === "true"
                        ? "bg-emerald-600 text-white ring-1 ring-emerald-500/80"
                        : v === "false"
                          ? "bg-zinc-600 text-white ring-1 ring-zinc-500/60"
                          : "bg-emerald-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">สถานะสต็อก</Label>
            <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 font-sans">
              {(
                [
                  { v: "all" as const, label: "ทั้งหมด" },
                  { v: "inStock" as const, label: "มีสินค้า" },
                  { v: "outOfStock" as const, label: "สินค้าหมด" },
                ] as const
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStockFilter(v)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                    stockFilter === v
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {label}
                  {v === "outOfStock" && stockFilter === "outOfStock" ? (
                    <span
                      className="rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white"
                      aria-hidden
                    >
                      0
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ค้นหา</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="ค้นหาชื่อสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-[220px] pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50">
                <TableHead className="w-[5.5rem] min-w-[5rem] align-bottom">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allPageSelected && pageIds.length > 0}
                        onChange={toggleSelectAll}
                        disabled={pageIds.length === 0 || isLoading}
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                        aria-label="เลือกทั้งหมดในหน้านี้"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-left text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                          >
                            เลือกแบบพิเศษ
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuItem
                            disabled={products.length === 0}
                            onClick={() => selectNoImageRows()}
                          >
                            เลือกสินค้าที่ไม่มีรูปภาพ (ในหน้านี้)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={products.length === 0}
                            onClick={() => selectZeroStockRows()}
                          >
                            เลือกสินค้าที่ไม่มีสต็อก (ในหน้านี้)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={totalCount === 0 || fetchingAllIds}
                            onClick={() => void selectAllMatchingFilter()}
                          >
                            {fetchingAllIds
                              ? "กำลังโหลด…"
                              : `เลือกทั้งหมดตามตัวกรอง (${totalCount} รายการ)`}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                {featuredOnly && (
                  <TableHead className="w-[5.5rem] font-[family-name:var(--font-journal-product-mono)] text-xs font-medium uppercase tracking-wide text-zinc-600">
                    Priority
                  </TableHead>
                )}
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>แบรนด์</TableHead>
                <TableHead>ประเภทพันธุกรรม</TableHead>
                <TableHead className="text-right">ราคาเริ่มต้น</TableHead>
                <TableHead className="text-right">สต็อกรวม</TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <ProductsTableSkeleton featuredMode={featuredOnly} />
              ) : products.length === 0 ? (
                <ProductsEmptyState
                  hasSearch={Boolean(debouncedSearch.trim())}
                  featuredOnly={featuredOnly}
                />
              ) : (
                products.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product as ProductFull}
                    onEdit={openEdit}
                    onStatusUpdated={refetch}
                    featuredManage={featuredOnly}
                    bulkSelect={{
                      checked: selectedIds.has(product.id as number),
                      onToggle: () => toggleOne(product.id as number),
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && totalCount > 0 ? (
            <div className="flex flex-col gap-3 border-t border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 bg-white"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  ก่อนหน้า
                </Button>
                <div className="flex flex-wrap items-center gap-1">
                  {paginationButtons(currentPage, totalPages).map((item, i) =>
                    item === "gap" ? (
                      <span key={`g-${i}`} className="px-1 text-zinc-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={cn(
                          "min-w-[2rem] rounded-md border px-2 py-1 text-sm transition-colors",
                          item === currentPage
                            ? "border-emerald-700 bg-emerald-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 bg-white"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  ถัดไป
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">แสดงต่อหน้า</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[88px] border-zinc-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ProductModal
        open={modalOpen}
        initialData={editProduct}
        onClose={() => {
          setModalOpen(false);
          setEditProduct(null);
          refetch();
        }}
      />

      {selectedIds.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div
            className="pointer-events-auto flex max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:gap-4"
            role="toolbar"
            aria-label="การจัดการแบบหลายรายการ"
          >
            <span className="text-sm font-medium text-zinc-800">
              เลือกแล้ว {selectedIds.size} รายการ
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-primary text-primary-foreground"
                disabled={bulkPending}
                onClick={() => void runBulkStatus(true)}
              >
                {bulkPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                เปิดการขาย
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-zinc-300"
                disabled={bulkPending}
                onClick={() => void runBulkStatus(false)}
              >
                {bulkPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                ปิดการขาย
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={bulkPending}
                onClick={() => setSelectedIds(new Set())}
              >
                ล้างการเลือก
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
