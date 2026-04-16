"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { toastErrorMessage } from "@/lib/admin-toast";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export type MagazineBlogCategoryRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ก-๙]+/g, "");
}

export function MagazineBlogCategoriesClient({
  initialCategories,
}: {
  initialCategories: MagazineBlogCategoryRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MagazineBlogCategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    setRows(initialCategories);
  }, [initialCategories]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog/categories", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(
          data.map((c: { id: number; name: string; slug: string; description: string | null; sort_order: number }) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            sort_order: c.sort_order,
          }))
        );
      }
      router.refresh();
    } catch {
      toast({
        title: "โหลดไม่สำเร็จ",
        description: "ลองรีเฟรชหน้า",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugManual(false);
    setDescription("");
    setSortOrder(rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0);
    setInlineError(null);
    setModalOpen(true);
  };

  const openEdit = (c: MagazineBlogCategoryRow) => {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setSlugManual(true);
    setDescription(c.description ?? "");
    setSortOrder(c.sort_order);
    setInlineError(null);
    setModalOpen(true);
  };

  const onNameChange = (v: string) => {
    setName(v);
    if (!editing && !slugManual) {
      setSlug(slugFromName(v));
    }
  };

  const onSlugChange = (v: string) => {
    setSlugManual(true);
    setSlug(v);
  };

  const handleSave = async () => {
    const n = name.trim();
    if (!n) {
      setInlineError("กรุณากรอกชื่อหมวด");
      return;
    }
    const s = slug.trim() ? slugFromName(slug) : slugFromName(n);
    if (!s) {
      setInlineError("ไม่สามารถสร้าง slug ได้ — กรอก slug เอง");
      return;
    }
    setSaving(true);
    setInlineError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/blog/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: n,
            slug: s,
            description: description.trim() || null,
            sort_order: sortOrder,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
        }
        toast({ title: "บันทึกแล้ว", description: `อัปเดตหมวด "${n}"` });
      } else {
        const res = await fetch("/api/admin/blog/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: n,
            slug: s,
            description: description.trim() || null,
            sort_order: sortOrder,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j.error ?? "สร้างไม่สำเร็จ");
        }
        toast({ title: "สร้างหมวดแล้ว", description: `"${n}" พร้อมใช้ใน dropdown` });
      }
      setModalOpen(false);
      await refetch();
    } catch (e) {
      setInlineError(toastErrorMessage(e));
      toast({
        title: "เกิดข้อผิดพลาด",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    setDeletingId(pendingDeleteId);
    try {
      const res = await fetch(`/api/admin/blog/categories/${pendingDeleteId}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "ลบไม่สำเร็จ");
      toast({
        title: "ลบแล้ว",
        description: "บทความที่ใช้หมวดนี้จะถูกตั้งเป็นไม่มีหมวด",
      });
      setPendingDeleteId(null);
      await refetch();
    } catch (e) {
      toast({
        title: "ลบไม่สำเร็จ",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-full bg-zinc-950 font-sans text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/magazine"
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80">
              <FolderOpen className="h-5 w-5 text-emerald-500/90" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Smile Seed Blog
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Article categories
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                ลำดับ (Sort order) ใช้เรียงใน dropdown ทุกหน้า admin ที่เลือกหมวด
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500/70" aria-hidden />
            ) : null}
            <Button
              onClick={openAdd}
              className="rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          {rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[100px] text-zinc-400">Sort</TableHead>
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Slug</TableHead>
                  <TableHead className="w-[120px] text-right text-zinc-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow
                    key={c.id}
                    className="border-zinc-800/80 hover:bg-zinc-900/50"
                  >
                    <TableCell className="font-mono text-sm text-zinc-300">
                      {c.sort_order}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-100">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">{c.slug}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                          onClick={() => openEdit(c)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-zinc-500 hover:bg-red-950/50 hover:text-red-400"
                          onClick={() => setPendingDeleteId(c.id)}
                          disabled={deletingId === c.id}
                          aria-label="Delete"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">
              {loading ? (
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500/70" />
              ) : (
                "ยังไม่มีหมวด — กด Add category"
              )}
            </p>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => !deletingId && setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        loading={pendingDeleteId !== null && deletingId === pendingDeleteId}
        title="ลบหมวดบทความ?"
        description="บทความที่ผูกหมวดนี้จะถูกตั้งเป็นไม่มีหมวด (category ว่าง) — ไม่ลบบทความ"
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-white">
              {editing ? "แก้ไขหมวด" : "เพิ่มหมวด"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Name *</Label>
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="เช่น Research, Hall of Flame"
                className="border-zinc-700 bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">
                Slug (ว่างได้ — สร้างจากชื่ออัตโนมัติ)
              </Label>
              <Input
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="research"
                className="border-zinc-700 bg-zinc-900/80 font-mono text-sm text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="คำอธิบายสั้น ๆ (ไม่บังคับ)"
                className="resize-y border-zinc-700 bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Sort order</Label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(parseInt(e.target.value, 10) || 0)
                }
                className="border-zinc-700 bg-zinc-900/80 text-zinc-100"
              />
            </div>
            {inlineError && (
              <p className="text-sm text-red-400">{inlineError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={() => setModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  "บันทึก"
                ) : (
                  "สร้าง"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
