"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, MousePointerClick, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { HeroCtaVariant } from "@/lib/homepage-hero-cta";

type HeroCtaRow = {
  id: string;
  label_th: string;
  label_en: string;
  href: string;
  variant: HeroCtaVariant;
  sort_order: number;
  is_active: boolean;
};

function SortableCtaRow({
  row,
  onPatch,
  onRemove,
  canRemove,
}: {
  row: HeroCtaRow;
  onPatch: (id: string, patch: Partial<HeroCtaRow>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm",
        isDragging && "z-50 border-emerald-500 ring-2 ring-emerald-500/20"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="touch-none shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`cta-th-${row.id}`} className="text-xs">
                ไทย (TH)
              </Label>
              <Input
                id={`cta-th-${row.id}`}
                value={row.label_th}
                onChange={(e) => onPatch(row.id, { label_th: e.target.value })}
                className="h-9 text-sm"
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`cta-en-${row.id}`} className="text-xs">
                English (EN)
              </Label>
              <Input
                id={`cta-en-${row.id}`}
                value={row.label_en}
                onChange={(e) => onPatch(row.id, { label_en: e.target.value })}
                className="h-9 text-sm"
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`cta-href-${row.id}`} className="text-xs">
              ลิงก์ปลายทาง (href)
            </Label>
            <p className="text-[10px] text-zinc-500">ใส่ `/seeds` ไม่ต้องใส่ `/th/` — ภาษาใช้ cookie ไม่ใช่ URL</p>
            <Input
              id={`cta-href-${row.id}`}
              value={row.href}
              onChange={(e) => onPatch(row.id, { href: e.target.value })}
              className="h-9 font-mono text-sm"
              placeholder="/seeds หรือ /shop?sort=new_arrivals"
              maxLength={512}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Label htmlFor={`cta-variant-${row.id}`} className="text-xs text-zinc-600">
                สไตล์
              </Label>
              <Select
                value={row.variant}
                onValueChange={(v) => onPatch(row.id, { variant: v as HeroCtaVariant })}
              >
                <SelectTrigger id={`cta-variant-${row.id}`} className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary (เขียว)</SelectItem>
                  <SelectItem value="outline">Outline (ขาว)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 border-l border-zinc-100 pl-3">
              <span className="text-xs text-zinc-500">แสดง</span>
              <Switch
                checked={row.is_active}
                onCheckedChange={(v) => onPatch(row.id, { is_active: v })}
                aria-label={`Toggle ${row.label_th}`}
              />
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-zinc-400 hover:text-red-600"
          disabled={!canRemove}
          aria-label={`ลบ ${row.label_th}`}
          onClick={() => onRemove(row.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function HeroCtaButtonsManagerClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<HeroCtaRow[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/homepage/hero-cta", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      const rows = (data.buttons ?? []) as HeroCtaRow[];
      setItems([...rows].sort((a, b) => a.sort_order - b.sort_order));
    } catch (e) {
      toast({
        title: "โหลดปุ่ม Hero ไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortableIds = useMemo(() => items.map((i) => i.id), [items]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  const onPatch = (id: string, patch: Partial<HeroCtaRow>) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onRemove = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      const buttons = items.map((row, index) => ({
        id: row.id,
        label_th: row.label_th.trim(),
        label_en: row.label_en.trim(),
        href: row.href.trim() || "/",
        variant: row.variant,
        sort_order: index,
        is_active: row.is_active,
      }));
      const res = await fetch("/api/admin/settings/homepage/hero-cta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buttons }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      toast({
        title: "บันทึกปุ่ม Hero แล้ว",
        description: "ลำดับ ข้อความ และลิงก์อัปเดตแล้ว — รีเฟรชหน้าร้านเพื่อดูผล",
      });
      await load();
    } catch (e) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[120px] items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800/10 text-emerald-900">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>ปุ่มเมนู Hero หน้าแรก</CardTitle>
            <CardDescription>
              ลากเรียงลำดับ แก้ข้อความ TH/EN ลิงก์ปลายทาง เปิด/ปิด — กดถังขยะเพื่อลบ แล้ว Save
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((row) => (
                <SortableCtaRow
                  key={row.id}
                  row={row}
                  onPatch={onPatch}
                  onRemove={onRemove}
                  canRemove={items.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          className="w-full bg-emerald-800 hover:bg-emerald-800/90 sm:w-auto"
          disabled={saving || items.length === 0}
          onClick={() => void save()}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก…
            </>
          ) : (
            "Save Hero Buttons"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
