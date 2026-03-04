"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, AlertTriangle, PackageX, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function ProductsPage() {
  const { products, isLoading, error, refetch } = useProducts({ autoFetch: true, includeVariants: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductFull | null>(null);
  const [search, setSearch] = useState("");

  const openAdd = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p: ProductFull) => { setEditProduct(p); setModalOpen(true); };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการสินค้า</h1>
          <p className="text-sm text-zinc-500">{products.length} รายการทั้งหมด</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าใหม่
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="ค้นหาชื่อสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
                <TableHead className="text-right">ราคาเริ่มต้น</TableHead>
                <TableHead className="text-right">สต็อกรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-zinc-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
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
                      <TableCell className="text-right text-sm font-medium text-zinc-800">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium ${
                            lowStock ? "text-red-600" : "text-zinc-700"
                          }`}
                        >
                          {lowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                          {product.stock}
                        </span>
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
