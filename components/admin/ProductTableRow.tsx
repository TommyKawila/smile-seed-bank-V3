"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Package, PackageX, Pencil, Star, StarOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  /** Featured tab: show priority input + remove from featured */
  featuredManage?: boolean;
}

export function ProductTableRow({
  product,
  onEdit,
  onStatusUpdated,
  featuredManage = false,
}: ProductTableRowProps) {
  const { toast } = useToast();
  const lowStock = isLowStock(product.stock);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [active, setActive] = useState(Boolean(product.is_active));
  const [statusPending, setStatusPending] = useState(false);
  const [priorityInput, setPriorityInput] = useState(String(product.featured_priority ?? 0));
  const [priorityPending, setPriorityPending] = useState(false);
  const [unfeaturePending, setUnfeaturePending] = useState(false);

  useEffect(() => {
    setPriorityInput(String(product.featured_priority ?? 0));
  }, [product.id, product.featured_priority]);

  useEffect(() => {
    setActive(Boolean(product.is_active));
  }, [product.id, product.is_active]);

  useEffect(() => {
    setThumbLoaded(false);
  }, [product.image_url]);

  const patchFeaturedFields = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/products/${product.id}/field`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "อัปเดตไม่สำเร็จ");
  };

  const commitPriority = async () => {
    const n = parseInt(priorityInput, 10);
    if (Number.isNaN(n) || n < 0) {
      setPriorityInput(String(product.featured_priority ?? 0));
      return;
    }
    if (n === (product.featured_priority ?? 0)) return;
    setPriorityPending(true);
    try {
      await patchFeaturedFields({ featured_priority: n });
      toast({ title: "อัปเดตลำดับแล้ว", description: `Priority ${n}` });
      onStatusUpdated?.();
    } catch (e) {
      setPriorityInput(String(product.featured_priority ?? 0));
      toast({
        variant: "destructive",
        title: "ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPriorityPending(false);
    }
  };

  const removeFromFeatured = async () => {
    setUnfeaturePending(true);
    try {
      await patchFeaturedFields({ is_featured: false, featured_priority: null });
      toast({ title: "นำออกจากแนะนำแล้ว", description: product.name });
      onStatusUpdated?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setUnfeaturePending(false);
    }
  };

  const featuredHighlight = Boolean(product.is_featured);

  return (
    <TableRow
      className={cn(
        "group transition-colors hover:bg-zinc-50/90",
        featuredHighlight && "border-l-[3px] border-l-emerald-600 bg-emerald-50/40"
      )}
    >
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
      <TableCell className="font-medium text-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <span>{product.name}</span>
          {featuredHighlight && (
            <Badge
              variant="outline"
              className="shrink-0 border-emerald-600/50 bg-emerald-50 text-[10px] font-semibold uppercase tracking-wide text-emerald-800"
            >
              <Star className="mr-0.5 h-3 w-3" aria-hidden />
              Featured
            </Badge>
          )}
        </div>
      </TableCell>
      {featuredManage && (
        <TableCell className="w-[5.5rem]">
          <Input
            type="number"
            min={0}
            max={9999}
            disabled={priorityPending}
            value={priorityInput}
            onChange={(e) => setPriorityInput(e.target.value)}
            onBlur={() => void commitPriority()}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-8 w-[4.25rem] px-2 font-[family-name:var(--font-journal-product-mono)] text-sm tabular-nums"
            aria-label="Featured priority"
          />
        </TableCell>
      )}
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
        <div className="flex items-center gap-0.5">
          {featuredManage && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-700 hover:bg-amber-50 hover:text-amber-900"
              disabled={unfeaturePending}
              title="นำออกจากแนะนำ"
              aria-label="Remove from featured"
              onClick={() => void removeFromFeatured()}
            >
              <StarOff className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-primary"
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
