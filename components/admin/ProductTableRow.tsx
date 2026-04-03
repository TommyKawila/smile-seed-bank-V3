"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Package, PackageX, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { isLowStock } from "@/hooks/useProducts";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";

/** Tiny neutral blur for next/image placeholder while fetching. */
const THUMB_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2U0ZTRlNyIvPjwvc3ZnPg==";

export interface ProductTableRowProps {
  product: ProductFull;
  onEdit: (product: ProductFull) => void;
}

export function ProductTableRow({ product, onEdit }: ProductTableRowProps) {
  const lowStock = isLowStock(product.stock);
  const [thumbLoaded, setThumbLoaded] = useState(false);

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
        <Badge
          className={
            product.is_active
              ? "bg-accent text-primary hover:bg-accent"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-100"
          }
        >
          {product.is_active ? "เปิดขาย" : "ปิดอยู่"}
        </Badge>
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
