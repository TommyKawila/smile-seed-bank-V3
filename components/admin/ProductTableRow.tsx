"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Package, PackageX, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { isLowStock } from "@/hooks/useProducts";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";

/** Tiny neutral blur for next/image placeholder while fetching. */
const THUMB_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2U0ZTRlNyIvPjwvc3ZnPg==";

export interface ProductTableRowProps {
  product: ProductFull;
  onEdit: (product: ProductFull) => void;
  onStatusUpdated?: () => void;
}

export function ProductTableRow({ product, onEdit, onStatusUpdated }: ProductTableRowProps) {
  const { toast } = useToast();
  const lowStock = isLowStock(product.stock);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [active, setActive] = useState(Boolean(product.is_active));
  const [statusPending, setStatusPending] = useState(false);

  useEffect(() => {
    setActive(Boolean(product.is_active));
  }, [product.id, product.is_active]);

  useEffect(() => {
    setThumbLoaded(false);
  }, [product.image_url]);

  return (
    <TableRow className="group transition-colors hover:bg-zinc-50/90">
      <TableCell className="align-middle">
        {product.image_url ? (
          <div
            className={cn(
              "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200/90 bg-gradient-to-br from-zinc-200/40 via-zinc-100 to-zinc-50 shadow-sm ring-1 ring-black/[0.03]",
              !thumbLoaded && "animate-pulse"
            )}
          >
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="48px"
              placeholder="blur"
              blurDataURL={THUMB_BLUR_DATA_URL}
              className={cn(
                "object-cover transition-all duration-300 ease-out group-hover:scale-110",
                thumbLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoadingComplete={() => setThumbLoaded(true)}
              onError={() => setThumbLoaded(true)}
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-gradient-to-br from-zinc-200/50 via-zinc-100 to-zinc-50 text-zinc-400 shadow-sm ring-1 ring-black/[0.03]">
            <PackageX className="h-5 w-5 opacity-70" strokeWidth={1.75} />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium text-zinc-900">{product.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {product.category ?? "—"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-zinc-500">{product.breeders?.name ?? "—"}</TableCell>
      <TableCell className="text-sm text-zinc-500">{product.strain_dominance ?? "—"}</TableCell>
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
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
          <Switch
            checked={active}
            disabled={statusPending}
            onCheckedChange={async (next) => {
              const prev = active;
              setActive(next);
              setStatusPending(true);
              try {
                const res = await fetch(`/api/admin/products/${product.id}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ is_active: next }),
                });
                const data = (await res.json()) as {
                  is_active?: boolean;
                  couldNotActivate?: boolean;
                  error?: string;
                };
                if (!res.ok) throw new Error(data.error ?? "อัปเดตสถานะไม่สำเร็จ");
                setActive(Boolean(data.is_active));
                toast({
                  title: "สำเร็จ (Success)",
                  description: data.couldNotActivate
                    ? "สต็อกไม่เพียงพอ — สถานะยังปิดอยู่ (Insufficient stock — still off)"
                    : "อัปเดตสถานะสินค้าแล้ว (Product status updated)",
                });
                onStatusUpdated?.();
              } catch (e) {
                setActive(prev);
                toast({
                  variant: "destructive",
                  title: "ไม่สำเร็จ",
                  description: e instanceof Error ? e.message : String(e),
                });
              } finally {
                setStatusPending(false);
              }
            }}
            aria-label={active ? "เปิดขาย" : "ปิดขาย"}
          />
          <Badge
            variant="outline"
            className={
              active
                ? "border-primary/30 bg-accent/50 text-primary"
                : "border-zinc-200 bg-zinc-50 text-zinc-500"
            }
          >
            {active ? "เปิดขาย" : "ปิดอยู่"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:text-primary"
          onClick={() => onEdit(product)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
