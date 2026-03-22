"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Search, AlertTriangle, PackageX, Pencil, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ProductModal } from "@/components/admin/ProductModal";
import { useProducts, isLowStock } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";

const STRAIN_DOMINANCE_OPTIONS = ["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"] as const;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [breederId, setBreederId] = useState(() => searchParams.get("breeder") ?? "");
  const [categoryId, setCategoryId] = useState(() => searchParams.get("category") ?? "all");
  const [dominance, setDominance] = useState(() => searchParams.get("dominance") ?? "all");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const { products, isLoading, error, refetch } = useProducts({
    autoFetch: true,
    includeVariants: true,
    breeder_id: breederId ? Number(breederId) : undefined,
    categoryId: categoryId && categoryId !== "all" ? categoryId : undefined,
    strain_dominance: dominance && dominance !== "all" ? (dominance as "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50") : undefined,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductFull | null>(null);

  const openAdd = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p: ProductFull) => { setEditProduct(p); setModalOpen(true); };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (breederId) params.set("breeder", breederId);
    if (categoryId && categoryId !== "all") params.set("category", categoryId);
    if (dominance && dominance !== "all") params.set("dominance", dominance);
    if (search) params.set("q", search);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [breederId, categoryId, dominance, search, router, pathname]);

  useEffect(() => {
    setBreederId(searchParams.get("breeder") ?? "");
    setCategoryId(searchParams.get("category") ?? "all");
    setDominance(searchParams.get("dominance") ?? "all");
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการสินค้า</h1>
          <p className="text-sm text-zinc-500">{filtered.length} รายการ{products.length !== filtered.length ? ` (จาก ${products.length})` : ""}</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าใหม่
        </Button>
      </div>

      {/* Filters */}
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
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
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
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-[220px] pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
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
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-zinc-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center">
                    <PackageX className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-400">
                      {search ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้า"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => {
                  const lowStock = isLowStock(product.stock);
                  return (
                    <TableRow key={product.id} className="hover:bg-zinc-50">
                      {/* Thumbnail */}
                      <TableCell>
                        {product.image_url ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-100">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                            <PackageX className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {product.category ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {product.breeders?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {(product as { strain_dominance?: string | null }).strain_dominance ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-zinc-500">
                        {formatPrice(product.price)}
                        <span className="ml-1 text-xs text-zinc-400">(แก้ที่ Inventory)</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium text-zinc-500 ${
                            lowStock ? "text-red-600" : ""
                          }`}
                        >
                          {lowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                          {product.stock}
                          <span className="ml-1 text-xs font-normal text-zinc-400">(แก้ที่ Inventory)</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/inventory/manual${product.breeder_id ? `?breederId=${product.breeder_id}` : ""}`}
                        >
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Package className="mr-1 h-3.5 w-3.5" />
                            Update Stock/Price
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            product.is_active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-100"
                          }
                        >
                          {product.is_active ? "เปิดขาย" : "ปิดอยู่"}
                        </Badge>
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-emerald-700"
                          onClick={() => openEdit(product as unknown as ProductFull)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Modal */}
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
