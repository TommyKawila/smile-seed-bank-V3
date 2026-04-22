"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  ChevronLeft,
  GripVertical,
  LayoutTemplate,
  Loader2,
  Settings2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type HomepageSectionRow = {
  id: string;
  key: string;
  label_th: string;
  label_en: string;
  sort_order: number;
  is_active: boolean;
};

/** Placeholder previews (picsum seeds) — swap for real screenshots in `public/` later. */
const HOMEPAGE_SECTION_PREVIEW_IMAGES: Record<string, string> = {
  hero: "https://picsum.photos/seed/ssb-home-hero/96/64",
  categories: "https://picsum.photos/seed/ssb-home-categories/96/64",
  breeder_showcase: "https://picsum.photos/seed/ssb-home-breeder-grid/96/64",
  blog: "https://picsum.photos/seed/ssb-home-blog/96/64",
  featured: "https://picsum.photos/seed/ssb-home-featured/96/64",
  breeders: "https://picsum.photos/seed/ssb-home-breeders-ribbon/96/64",
  trust: "https://picsum.photos/seed/ssb-home-trust/96/64",
  new_strains: "https://picsum.photos/seed/ssb-home-new/96/64",
  newsletter: "https://picsum.photos/seed/ssb-home-newsletter/96/64",
  clearance: "https://picsum.photos/seed/ssb-home-clearance/96/64",
};

/** Short hint under the technical `key` in admin list (not stored in DB). */
const HOMEPAGE_SECTION_KEY_HINTS: Record<string, string> = {
  breeder_showcase: "Icon grid · BreederShowcase",
  breeders: "Horizontal slider · BreederRibbon",
  categories: "Quick pills · QuickCategoryNav",
  clearance: "Dark rail · ClearanceSection (carousel / grid)",
  featured: "Hero carousel · FeaturedProductHero (DB featured products)",
};

function sectionPreviewSrc(key: string): string {
  return HOMEPAGE_SECTION_PREVIEW_IMAGES[key] ?? "https://picsum.photos/seed/ssb-home-generic/96/64";
}

function SortableRow({
  row,
  onToggle,
  onLabelsChange,
  previewLabelsEnabled,
}: {
  row: HomepageSectionRow;
  onToggle: (id: string, next: boolean) => void;
  onLabelsChange: (id: string, patch: Partial<Pick<HomepageSectionRow, "label_th" | "label_en">>) => void;
  previewLabelsEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const previewUrl = sectionPreviewSrc(row.key);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2 shadow-sm sm:gap-3 sm:px-3",
        isDragging && "z-50 border-emerald-500 ring-2 ring-emerald-500/20"
      )}
    >
      <button
        type="button"
        className="touch-none shrink-0 self-center rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
        <img
          src={previewUrl}
          alt=""
          width={96}
          height={64}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="min-w-0 flex-1 self-center py-0.5">
        {previewLabelsEnabled ? (
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-snug text-zinc-900">{row.label_th || "—"}</p>
            <p className="text-xs leading-snug text-zinc-500">{row.label_en || "—"}</p>
            <p className="font-mono text-[10px] text-zinc-400">{row.key}</p>
            {HOMEPAGE_SECTION_KEY_HINTS[row.key] ? (
              <p className="text-[10px] leading-snug text-zinc-500">{HOMEPAGE_SECTION_KEY_HINTS[row.key]}</p>
            ) : null}
          </div>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-zinc-900">{row.label_th}</p>
            <p className="truncate text-xs text-zinc-500">
              {row.label_en} · <span className="font-mono text-[10px] text-zinc-400">{row.key}</span>
              {HOMEPAGE_SECTION_KEY_HINTS[row.key] ? (
                <span className="mt-0.5 block text-[10px] text-zinc-400">
                  {HOMEPAGE_SECTION_KEY_HINTS[row.key]}
                </span>
              ) : null}
            </p>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-zinc-600"
              aria-label="Edit section labels"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4 sm:w-[22rem]"
            align="end"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-500">ป้ายชื่อส่วน (บันทึกเมื่อกด Save Layout)</p>
              <div className="space-y-1.5">
                <Label htmlFor={`lt-${row.id}`} className="text-xs">
                  ไทย (TH)
                </Label>
                <Input
                  id={`lt-${row.id}`}
                  value={row.label_th}
                  onChange={(e) => onLabelsChange(row.id, { label_th: e.target.value })}
                  className="h-9 text-sm"
                  maxLength={240}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`le-${row.id}`} className="text-xs">
                  English (EN)
                </Label>
                <Input
                  id={`le-${row.id}`}
                  value={row.label_en}
                  onChange={(e) => onLabelsChange(row.id, { label_en: e.target.value })}
                  className="h-9 text-sm"
                  maxLength={240}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1.5 border-l border-zinc-100 pl-1 sm:pl-2">
          <span className="hidden text-xs text-zinc-500 sm:inline">แสดง</span>
          <Switch
            checked={row.is_active}
            onCheckedChange={(v) => onToggle(row.id, v)}
            aria-label={`Toggle ${row.key}`}
          />
        </div>
      </div>
    </div>
  );
}

export default function HomepageLayoutSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<HomepageSectionRow[]>([]);
  const [previewLabelsEnabled, setPreviewLabelsEnabled] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/homepage", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      const rows = (data.sections ?? []) as HomepageSectionRow[];
      setItems([...rows].sort((a, b) => a.sort_order - b.sort_order));
    } catch (e) {
      toast({
        title: "โหลดไม่สำเร็จ",
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

  const onToggle = (id: string, is_active: boolean) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, is_active } : r)));
  };

  const onLabelsChange = (
    id: string,
    patch: Partial<Pick<HomepageSectionRow, "label_th" | "label_en">>
  ) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      const sections = items.map((row, index) => ({
        id: row.id,
        sort_order: index,
        is_active: row.is_active,
        label_th: row.label_th.trim() || "—",
        label_en: row.label_en.trim() || "—",
      }));
      const res = await fetch("/api/admin/settings/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      toast({
        title: "บันทึกแล้ว",
        description: "ลำดับและป้ายชื่อหน้าแรกอัปเดตแล้ว — รีเฟรชหน้าร้านเพื่อดูผล",
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1 text-zinc-600">
          <Link href="/admin/settings">
            <ChevronLeft className="h-4 w-4" />
            ตั้งค่าร้านค้า
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800/10 text-emerald-900">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>หน้าแรก (Homepage)</CardTitle>
              <CardDescription>
                ลากจัดลำดับ เปิด/ปิดส่วน แก้ป้ายชื่อ TH/EN — รูปย่อเป็นตัวอย่างเท่านั้น
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/90 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preview-storefront-labels" className="text-sm font-medium text-zinc-800">
                Preview Storefront Labels
              </Label>
              <p className="text-xs text-zinc-500">
                แสดงตัวอย่างป้าย TH/EN ในรายการ (ชื่อในหน้าร้านยังอิงคอมโพเนนต์เดิมจนกว่าจะผูกจาก DB)
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-600">ปิด</span>
              <Switch
                id="preview-storefront-labels"
                checked={previewLabelsEnabled}
                onCheckedChange={setPreviewLabelsEnabled}
              />
              <span className="text-xs text-zinc-600">เปิด</span>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    onToggle={onToggle}
                    onLabelsChange={onLabelsChange}
                    previewLabelsEnabled={previewLabelsEnabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            type="button"
            className="w-full bg-emerald-800 hover:bg-emerald-800/90 sm:w-auto"
            disabled={saving || items.length === 0}
            onClick={() => void saveLayout()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก…
              </>
            ) : (
              "Save Layout"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
