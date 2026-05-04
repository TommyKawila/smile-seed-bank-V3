"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DynamicBanner } from "@/services/banner-service";
import { isBannerExpiringWithin, isBannerVisibleNow } from "@/lib/banner-schedule";
import { cn } from "@/lib/utils";

const ADMIN_EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;

type ImageField =
  | "desktop_image_th"
  | "desktop_image_en"
  | "mobile_image_th"
  | "mobile_image_en";

type BannerForm = {
  id: string | null;
  title_th: string;
  title_en: string;
  desktop_image_th: string;
  desktop_image_en: string;
  mobile_image_th: string;
  mobile_image_en: string;
  link_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const IMAGE_FIELDS: { key: ImageField; label: string; size: string }[] = [
  { key: "desktop_image_th", label: "Desktop TH (required)", size: "1920x700" },
  { key: "desktop_image_en", label: "Desktop EN (optional)", size: "1920x700" },
  { key: "mobile_image_th", label: "Mobile TH (optional)", size: "800x1000" },
  { key: "mobile_image_en", label: "Mobile EN (optional)", size: "800x1000" },
];

function emptyForm(): BannerForm {
  return {
    id: null,
    title_th: "",
    title_en: "",
    desktop_image_th: "",
    desktop_image_en: "",
    mobile_image_th: "",
    mobile_image_en: "",
    link_url: "",
    start_date: "",
    end_date: "",
    is_active: true,
  };
}

function formFromBanner(banner: DynamicBanner): BannerForm {
  return {
    id: banner.id,
    title_th: banner.title_th ?? "",
    title_en: banner.title_en ?? "",
    desktop_image_th: banner.desktop_image_th,
    desktop_image_en: banner.desktop_image_en ?? "",
    mobile_image_th: banner.mobile_image_th ?? "",
    mobile_image_en: banner.mobile_image_en ?? "",
    link_url: banner.link_url ?? "",
    start_date: isoToDatetimeLocalValue(banner.start_date),
    end_date: isoToDatetimeLocalValue(banner.end_date),
    is_active: banner.is_active,
  };
}

function optionalImagePayload(value: string): string | null {
  const t = value.trim();
  return t === "" ? null : t;
}

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalInputToIso(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function uploadBannerFile(field: ImageField, file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("key", `dynamic-banner-${field}`);
  form.set("bucket", "site-assets");

  const res = await fetch("/api/admin/settings/upload?preset=hero", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

function scheduleBadgeLabel(banner: DynamicBanner): string | null {
  if (!banner.is_active || isBannerVisibleNow(banner)) return null;
  if (banner.start_date && Date.now() < Date.parse(banner.start_date)) return "Starts later";
  if (banner.end_date && Date.now() > Date.parse(banner.end_date)) return "Schedule ended";
  return null;
}

function SortableBannerRow({
  banner,
  onEdit,
  onDelete,
}: {
  banner: DynamicBanner;
  onEdit: (banner: DynamicBanner) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: banner.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const scheduleHint = scheduleBadgeLabel(banner);
  const expiringSoon = isBannerExpiringWithin(banner, ADMIN_EXPIRING_SOON_MS);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-[40px_120px_minmax(0,1fr)_auto]",
        isDragging && "z-10 shadow-lg",
        expiringSoon && "border-amber-400 bg-amber-50/70 ring-2 ring-amber-200/90"
      )}
    >
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-50"
        {...attributes}
        {...listeners}
        aria-label="Drag banner"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="relative aspect-[21/9] overflow-hidden rounded-lg bg-zinc-100 md:aspect-[4/3]">
        {banner.desktop_image_th ? (
          <Image src={banner.desktop_image_th} alt={banner.title_th ?? "Banner"} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium text-zinc-900">{banner.title_th || "Untitled banner"}</h3>
          <Badge variant={banner.is_active ? "default" : "outline"}>
            {banner.is_active ? "Active" : "Hidden"}
          </Badge>
          {expiringSoon ? (
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-100 text-[10px] font-medium text-amber-950"
            >
              ใกล้หมดเวลา · Expiring soon
            </Badge>
          ) : null}
          {scheduleHint ? (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {scheduleHint}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">{banner.title_en || "No EN title"}</p>
        {banner.link_url ? (
          <p className="mt-1 truncate text-xs text-zinc-400">{banner.link_url}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(banner)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(banner.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

export function BannerManagerClient({ initialBanners }: { initialBanners: DynamicBanner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BannerForm>(() => emptyForm());
  const [files, setFiles] = useState<Partial<Record<ImageField, File>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const sortableIds = useMemo(() => banners.map((banner) => banner.id), [banners]);

  const openCreate = () => {
    setForm(emptyForm());
    setFiles({});
    setError(null);
    setOpen(true);
  };

  const openEdit = (banner: DynamicBanner) => {
    setForm(formFromBanner(banner));
    setFiles({});
    setError(null);
    setOpen(true);
  };

  const persistOrder = async (next: DynamicBanner[]) => {
    await fetch("/api/admin/banners/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerIds: next.map((banner) => banner.id) }),
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = banners.findIndex((banner) => banner.id === String(active.id));
    const newIndex = banners.findIndex((banner) => banner.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(banners, oldIndex, newIndex);
    setBanners(next);
    void persistOrder(next);
  };

  const saveBanner = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      for (const field of IMAGE_FIELDS) {
        const file = files[field.key];
        if (file) payload[field.key] = await uploadBannerFile(field.key, file);
      }

      if (!payload.desktop_image_th.trim()) {
        setError("Primary Thai desktop image is required (upload or paste URL).");
        return;
      }

      const res = await fetch(payload.id ? `/api/admin/banners/${payload.id}` : "/api/admin/banners", {
        method: payload.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_th: payload.title_th || null,
          title_en: payload.title_en || null,
          desktop_image_th: payload.desktop_image_th.trim(),
          desktop_image_en: optionalImagePayload(payload.desktop_image_en),
          mobile_image_th: optionalImagePayload(payload.mobile_image_th),
          mobile_image_en: optionalImagePayload(payload.mobile_image_en),
          link_url: payload.link_url || null,
          start_date: datetimeLocalInputToIso(payload.start_date),
          end_date: datetimeLocalInputToIso(payload.end_date),
          is_active: payload.is_active,
        }),
      });
      const rawText = await res.text();
      let data: { banner?: DynamicBanner; error?: string } = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText) as { banner?: DynamicBanner; error?: string };
        } catch {
          throw new Error("Invalid response from server");
        }
      }
      if (!res.ok || !data.banner) throw new Error(data.error ?? "Save failed");
      const savedBanner = data.banner;
      setBanners((prev) =>
        payload.id
          ? prev.map((banner) => (banner.id === savedBanner.id ? savedBanner : banner))
          : [...prev, savedBanner]
      );
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteBannerById = async (id: string) => {
    if (!window.confirm("Delete this banner?")) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) setBanners((prev) => prev.filter((banner) => banner.id !== id));
  };

  return (
    <>
      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Home Carousel</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Drag to set order. First active banner is the LCP image on storefront.
            </p>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
              No banners yet. Storefront will use the original Hero fallback.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <SortableBannerRow
                      key={banner.id}
                      banner={banner}
                      onEdit={openEdit}
                      onDelete={deleteBannerById}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Home Banner" : "Add Home Banner"}</DialogTitle>
            <DialogDescription>Desktop 1920x700, mobile 800x1000 for Thai and English.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title TH</Label>
              <Input value={form.title_th} onChange={(e) => setForm({ ...form, title_th: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Title EN</Label>
              <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Link URL</Label>
              <Input
                value={form.link_url}
                placeholder="/seeds or https://..."
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {IMAGE_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2 rounded-xl border border-zinc-200 p-3">
                <Label>
                  {field.label} <span className="text-xs font-normal text-zinc-400">{field.size}</span>
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFiles((prev) => ({ ...prev, [field.key]: file }));
                  }}
                />
                <Input
                  value={form[field.key]}
                  placeholder="Image URL"
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Visible from</Label>
              <Input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
              <p className="text-xs text-zinc-500">Empty = show immediately.</p>
            </div>
            <div className="space-y-2">
              <Label>Visible until</Label>
              <Input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
              <p className="text-xs text-zinc-500">Empty = no end; end is inclusive minute.</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Active</p>
              <p className="text-xs text-zinc-500">Hidden banners stay in admin but do not render.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveBanner} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
