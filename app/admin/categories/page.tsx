"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

type Category = { id: string; name: string; sort_order: number | null };

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setSortOrder(categories.length + 1);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setSortOrder(c.sort_order ?? 0);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), sort_order: sortOrder }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
        }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), sort_order: sortOrder }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "สร้างไม่สำเร็จ");
        }
      }
      setModalOpen(false);
      fetchCategories();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    const id = categoryPendingDelete;
    if (!id) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "ลบไม่สำเร็จ");
      }
      toast({
        title: "สำเร็จ (Success)",
        description: "ลบหมวดหมู่เรียบร้อยแล้ว / Category removed.",
      });
      setCategoryPendingDelete(null);
      fetchCategories();
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการหมวดหมู่ (Categories)</h1>
          <p className="text-sm text-zinc-500">Photo, Auto, Auto Original Line, CBD — ใช้ใน Manual Grid และ Product</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            setMigrating(true);
            try {
              const res = await fetch("/api/admin/migrate/category-id", { method: "POST" });
              const j = await res.json();
              if (res.ok) {
                toast({
                  title: "สำเร็จ (Success)",
                  description: `Migrate category_id แล้ว ${j.updated ?? 0} รายการ (products).`,
                });
              } else {
                toast({
                  title: "เกิดข้อผิดพลาด (Error)",
                  description: j.error ?? "Failed",
                  variant: "destructive",
                });
              }
              fetchCategories();
            } finally {
              setMigrating(false);
            }
          }}
          disabled={migrating}
        >
          {migrating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Migrate category_id
        </Button>
        <Button onClick={openAdd} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มหมวดหมู่
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-700">ลำดับ</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">ชื่อ</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                  <td className="px-4 py-3 text-zinc-600">{c.sort_order ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{c.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(c)}
                        className="h-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCategoryPendingDelete(c.id)}
                        disabled={deleting === c.id}
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {deleting === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && (
            <div className="py-12 text-center text-zinc-500">ยังไม่มีหมวดหมู่ — กดเพิ่มหมวดหมู่</div>
          )}
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={categoryPendingDelete !== null}
        onClose={() => setCategoryPendingDelete(null)}
        onConfirm={confirmDeleteCategory}
        loading={
          categoryPendingDelete !== null && deleting === categoryPendingDelete
        }
        title="ยืนยันการลบ / Confirm Deletion"
        description="ลบหมวดหมู่นี้? สินค้าที่เกี่ยวข้องจะถูกยกเลิก category_id / Products using this category will have category_id cleared. This cannot be undone."
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อ *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Regular, Fast Version"
                className="mt-1"
              />
            </div>
            <div>
              <Label>ลำดับ (sort_order)</Label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
