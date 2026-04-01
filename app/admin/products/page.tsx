"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Plus, Search, PackageX } from "lucide-react";
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
import { useProducts } from "@/hooks/useProducts";
import type { ProductFull } from "@/types/supabase";

const STRAIN_DOMINANCE_OPTIONS = ["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"] as const;

function ProductsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="align-middle">
            <Skeleton className="h-12 w-12 rounded-lg" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[min(100%,12rem)] max-w-full rounded-md" />
          </TableCell>
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

function ProductsEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={10} className="p-0">
        <EmptyState
          icon={PackageX}
          title={hasSearch ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้า"}
          description={
            hasSearch
              ? "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง"
              : "เริ่มต้นด้วยการเพิ่มสินค้าใหม่จากปุ่มด้านบน"
          }
        />
      </TableCell>
    </TableRow>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const [breederId, setBreederId] = useState(() => searchParams.get("breeder") ?? "");
  const [categoryId, setCategoryId] = useState(() => searchParams.get("category") ?? "all");
  const [dominance, setDominance] = useState(() => searchParams.get("dominance") ?? "all");

  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const { products, isLoading, error, refetch } = useProducts({
    autoFetch: true,
    includeVariants: true,
    breeder_id: breederId ? Number(breederId) : undefined,
    categoryId: categoryId && categoryId !== "all" ? categoryId : undefined,
    strain_dominance:
      dominance && dominance !== "all"
        ? (dominance as (typeof STRAIN_DOMINANCE_OPTIONS)[number])
        : undefined,
  });

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

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchTerm]);

  useEffect(() => {
    setBreederId(searchParams.get("breeder") ?? "");
    setCategoryId(searchParams.get("category") ?? "all");
    setDominance(searchParams.get("dominance") ?? "all");
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

    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;

    const href = next ? `${pathname}?${next}` : pathname;
    router.replace(href, { scroll: false });
  }, [debouncedSearch, breederId, categoryId, dominance, pathname, router, searchParams]);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการสินค้า</h1>
          <p className="text-sm text-zinc-500">
            {filteredProducts.length} รายการ
            {products.length !== filteredProducts.length ? ` (จาก ${products.length})` : ""}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าใหม่
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
                <TableHead className="w-12"></TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
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
                <ProductsTableSkeleton />
              ) : filteredProducts.length === 0 ? (
                <ProductsEmptyState hasSearch={Boolean(searchTerm.trim())} />
              ) : (
                filteredProducts.map((product) => (
                  <ProductTableRow key={product.id} product={product as ProductFull} onEdit={openEdit} />
                ))
              )}
            </TableBody>
          </Table>
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
    </div>
  );
}
