"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Pencil, Plus, Shirt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MERCH_CATEGORIES, type MerchCategoryId } from "@/lib/merch-catalog";
import { formatPrice } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";

type MerchRow = ProductFull & {
  product_kind?: string;
  merch_category?: string | null;
};

type VariantRow = {
  id?: number;
  unit_label: string;
  price: string;
  stock: string;
  sku: string;
};

type FormState = {
  name: string;
  slug: string;
  breeder_id: string;
  merch_category: MerchCategoryId;
  description_th: string;
  description_en: string;
  image_url: string;
  is_active: boolean;
  variants: VariantRow[];
};

const emptyVariant = (): VariantRow => ({
  unit_label: "One Size",
  price: "0",
  stock: "0",
  sku: "",
});

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  breeder_id: "",
  merch_category: "tees",
  description_th: "",
  description_en: "",
  image_url: "",
  is_active: true,
  variants: [emptyVariant()],
});

function rowToForm(row: MerchRow): FormState {
  return {
    name: row.name,
    slug: row.slug ?? "",
    breeder_id: row.breeder_id != null ? String(row.breeder_id) : "",
    merch_category: (row.merch_category as MerchCategoryId) || "tees",
    description_th: row.description_th ?? "",
    description_en: row.description_en ?? "",
    image_url: row.image_url ?? "",
    is_active: row.is_active !== false,
    variants:
      row.product_variants?.length
        ? row.product_variants.map((v) => ({
            id: v.id,
            unit_label: v.unit_label,
            price: String(v.price ?? 0),
            stock: String(v.stock ?? 0),
            sku: v.sku ?? "",
          }))
        : [emptyVariant()],
  };
}

export function MerchAdminClient() {
  const { toast } = useToast();
  const [products, setProducts] = useState<MerchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [breederOptions, setBreederOptions] = useState<{ id: number; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/merch", { cache: "no-store" });
      const json = (await res.json()) as { products?: MerchRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setProducts(json.products ?? []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลด Merch ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/breeders")
      .then((r) => r.json())
      .then((data: { id: number | string; name: string; is_active?: boolean | null }[]) => {
        if (!Array.isArray(data)) return;
        setBreederOptions(
          data
            .filter((b) => b.is_active !== false)
            .map((b) => ({ id: Number(b.id), name: b.name }))
            .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
        );
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: MerchRow) => {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        breeder_id: Number(form.breeder_id),
        merch_category: form.merch_category,
        description_th: form.description_th.trim() || null,
        description_en: form.description_en.trim() || null,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        variants: form.variants.map((v) => ({
          id: v.id,
          unit_label: v.unit_label.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          sku: v.sku.trim() || null,
        })),
      };

      const res = await fetch(
        editingId != null ? `/api/admin/merch/${editingId}` : "/api/admin/merch",
        {
          method: editingId != null ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");

      toast({ title: editingId != null ? "อัปเดต Merch แล้ว" : "สร้าง Merch แล้ว" });
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "บันทึกไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ปิดการแสดงสินค้า Merch นี้?")) return;
    try {
      const res = await fetch(`/api/admin/merch/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ลบไม่สำเร็จ");
      toast({ title: "ปิดการแสดงแล้ว" });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "ลบไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const categoryLabel = (id: string | null | undefined) =>
    MERCH_CATEGORIES.find((c) => c.id === id)?.labelTh ?? id ?? "—";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Shirt className="h-6 w-6" />
            Merchandise
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการสินค้า Merch แยกจากเมล็ดพันธุ์ · ยังไม่ผูกตะกร้า
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มสินค้า Merch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการ Merch ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีสินค้า Merch — กด &quot;เพิ่มสินค้า Merch&quot;
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>ค่าย</TableHead>
                  <TableHead>หมวด</TableHead>
                  <TableHead>ราคา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                          {p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : null}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.breeders?.name ?? "—"}</TableCell>
                    <TableCell>{categoryLabel(p.merch_category)}</TableCell>
                    <TableCell>{formatPrice(Number(p.price ?? 0))}</TableCell>
                    <TableCell>{p.is_active ? "เปิด" : "ปิด"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void remove(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "แก้ไข Merch" : "เพิ่ม Merch"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="merch-name">ชื่อสินค้า</Label>
              <Input
                id="merch-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merch-slug">Slug (optional)</Label>
              <Input
                id="merch-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>ค่าย</Label>
                <Select
                  value={form.breeder_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, breeder_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกค่าย" />
                  </SelectTrigger>
                  <SelectContent>
                    {breederOptions.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>หมวด Merch</Label>
                <Select
                  value={form.merch_category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, merch_category: v as MerchCategoryId }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MERCH_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.labelTh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merch-img">รูป (URL)</Label>
              <Input
                id="merch-img"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merch-desc-th">คำอธิบาย (TH)</Label>
              <Input
                id="merch-desc-th"
                value={form.description_th}
                onChange={(e) => setForm((f) => ({ ...f, description_th: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merch-desc-en">Description (EN)</Label>
              <Input
                id="merch-desc-en"
                value={form.description_en}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>เปิดแสดงบน storefront</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Variants (ไซส์ / ราคา / สต็อก)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }))
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  เพิ่มไซส์
                </Button>
              </div>
              {form.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="ไซส์"
                    value={v.unit_label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variants: f.variants.map((row, j) =>
                          j === i ? { ...row, unit_label: e.target.value } : row
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="ราคา"
                    type="number"
                    value={v.price}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variants: f.variants.map((row, j) =>
                          j === i ? { ...row, price: e.target.value } : row
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="สต็อก"
                    type="number"
                    value={v.stock}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variants: f.variants.map((row, j) =>
                          j === i ? { ...row, stock: e.target.value } : row
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={form.variants.length <= 1}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        variants: f.variants.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
