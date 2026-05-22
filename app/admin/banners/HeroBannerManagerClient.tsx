"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
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
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import type { CSSProperties } from "react";
import Image from "next/image";
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
import type { HeroBannerAdmin } from "@/lib/hero-banner-admin";
import {
  HERO_DESKTOP_UPLOAD_SPEC,
  HERO_MOBILE_UPLOAD_SPEC,
} from "@/components/storefront/hero-carousel-image-sizes";
import { isBannerExpiringWithin } from "@/lib/banner-schedule";
import { cn } from "@/lib/utils";

const ADMIN_EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;

type ImageField = "desktopTh" | "desktopEn" | "mobileTh" | "mobileEn";

type HeroForm = {
  id: string | null;
  titleTh: string;
  titleEn: string;
  linkUrl: string;
  panelBgHex: string;
  desktopTh: string;
  desktopEn: string;
  mobileTh: string;
  mobileEn: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

type HeroScheduleLabel = "inactive" | "scheduled" | "expired" | "active";

const IMAGE_FIELDS: {
  key: ImageField;
  label: string;
  size: string;
  previewAspect: string;
}[] = [
  {
    key: "desktopTh",
    label: "Desktop TH (required)",
    size: `Desktop: ${HERO_DESKTOP_UPLOAD_SPEC}`,
    previewAspect: "aspect-[617/712]",
  },
  {
    key: "desktopEn",
    label: "Desktop EN (optional)",
    size: `Desktop: ${HERO_DESKTOP_UPLOAD_SPEC}`,
    previewAspect: "aspect-[617/712]",
  },
  {
    key: "mobileTh",
    label: "Mobile TH (optional)",
    size: `Mobile: ${HERO_MOBILE_UPLOAD_SPEC}`,
    previewAspect: "aspect-[392/429]",
  },
  {
    key: "mobileEn",
    label: "Mobile EN (optional)",
    size: `Mobile: ${HERO_MOBILE_UPLOAD_SPEC}`,
    previewAspect: "aspect-[392/429]",
  },
];

function emptyForm(): HeroForm {
  return {
    id: null,
    titleTh: "",
    titleEn: "",
    linkUrl: "",
    panelBgHex: "",
    desktopTh: "",
    desktopEn: "",
    mobileTh: "",
    mobileEn: "",
    startsAt: "",
    endsAt: "",
    active: true,
  };
}

function formFromBanner(banner: HeroBannerAdmin): HeroForm {
  return {
    id: banner.id,
    titleTh: banner.titleTh,
    titleEn: banner.titleEn ?? "",
    linkUrl: banner.linkUrl ?? "",
    panelBgHex: banner.panelBgHex ?? "",
    desktopTh: banner.desktopTh,
    desktopEn: banner.desktopEn ?? "",
    mobileTh: banner.mobileTh ?? "",
    mobileEn: banner.mobileEn ?? "",
    startsAt: isoToDatetimeLocalValue(banner.startsAt),
    endsAt: isoToDatetimeLocalValue(banner.endsAt),
    active: banner.active,
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

function formatScheduleInstant(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function heroScheduleLabel(banner: HeroBannerAdmin, nowMs = Date.now()): HeroScheduleLabel {
  if (!banner.active) return "inactive";
  const startMs = banner.startsAt ? Date.parse(banner.startsAt) : NaN;
  const endMs = banner.endsAt ? Date.parse(banner.endsAt) : NaN;
  if (!Number.isNaN(startMs) && nowMs < startMs) return "scheduled";
  if (!Number.isNaN(endMs) && nowMs > endMs) return "expired";
  return "active";
}

function scheduleStatusBadgeClasses(label: HeroScheduleLabel): string {
  switch (label) {
    case "active":
      return "border-emerald-600/30 bg-emerald-50 text-emerald-900";
    case "scheduled":
      return "border-amber-400/80 bg-amber-50 text-amber-950";
    case "expired":
      return "border-red-200 bg-red-50 text-red-900";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
}

async function uploadHeroBannerFile(field: ImageField, file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("key", `hero-fade-${field}`);
  form.set("bucket", "site-assets");

  const res = await fetch("/api/admin/settings/upload?preset=hero", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

function SortableHeroRow({
  banner,
  onEdit,
  onDelete,
}: {
  banner: HeroBannerAdmin;
  onEdit: (banner: HeroBannerAdmin) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const scheduleLabel = heroScheduleLabel(banner);
  const expiringSoon = isBannerExpiringWithin(
    { start_date: banner.startsAt, end_date: banner.endsAt, is_active: banner.active },
    ADMIN_EXPIRING_SOON_MS
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-[40px_120px_minmax(0,1fr)_auto]",
        isDragging && "z-10 shadow-lg",
        expiringSoon && scheduleLabel === "active" && "border-amber-400 bg-amber-50/70 ring-2 ring-amber-200/90"
      )}
    >
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-50"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="relative aspect-[617/712] w-[min(100%,106px)] overflow-hidden rounded-lg bg-zinc-100">
        {banner.desktopTh ? (
          <Image src={banner.desktopTh} alt={banner.titleTh} fill className="object-cover object-center" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium text-zinc-900">{banner.titleTh || "Untitled"}</h3>
          <Badge variant="outline" className={cn("text-[10px] font-semibold", scheduleStatusBadgeClasses(scheduleLabel))}>
            {scheduleLabel === "active"
              ? "Active"
              : scheduleLabel === "scheduled"
                ? "Scheduled"
                : scheduleLabel === "expired"
                  ? "Expired"
                  : "Inactive"}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal">
            Sort {banner.sortOrder}
          </Badge>
          {expiringSoon && scheduleLabel === "active" ? (
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-100 text-[10px] font-medium text-amber-950"
            >
              Expiring soon
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-zinc-600">
          <span className="font-medium text-zinc-700">Visible from:</span> {formatScheduleInstant(banner.startsAt)}
        </p>
        <p className="text-xs text-zinc-600">
          <span className="font-medium text-zinc-700">Visible until:</span> {formatScheduleInstant(banner.endsAt)}
        </p>
        {banner.linkUrl ? <p className="truncate text-xs text-zinc-400">{banner.linkUrl}</p> : null}
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

export function HeroBannerManagerClient({ initialBanners }: { initialBanners: HeroBannerAdmin[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HeroForm>(() => emptyForm());
  const [files, setFiles] = useState<Partial<Record<ImageField, File>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const sortableIds = useMemo(() => banners.map((b) => b.id), [banners]);

  const fileBlobUrls = useMemo(() => {
    const out: Partial<Record<ImageField, string>> = {};
    (Object.entries(files) as [ImageField, File][]).forEach(([k, f]) => {
      out[k] = URL.createObjectURL(f);
    });
    return out;
  }, [files]);

  useEffect(() => {
    const urls = Object.values(fileBlobUrls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [fileBlobUrls]);

  const previewSrc = (field: ImageField): string | null => {
    const blob = fileBlobUrls[field];
    if (blob) return blob;
    const url = form[field].trim();
    return url || null;
  };

  const openCreate = () => {
    setForm(emptyForm());
    setFiles({});
    setError(null);
    setOpen(true);
  };

  const openEdit = (banner: HeroBannerAdmin) => {
    setForm(formFromBanner(banner));
    setFiles({});
    setError(null);
    setOpen(true);
  };

  const persistOrder = async (next: HeroBannerAdmin[]) => {
    await fetch("/api/admin/hero-banners/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroBannerIds: next.map((b) => b.id) }),
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = banners.findIndex((b) => b.id === String(active.id));
    const newIndex = banners.findIndex((b) => b.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(banners, oldIndex, newIndex).map((b, i) => ({ ...b, sortOrder: i }));
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
        if (file) payload[field.key] = await uploadHeroBannerFile(field.key, file);
      }

      if (!payload.desktopTh.trim()) {
        setError("Thai desktop image is required (upload or paste URL).");
        return;
      }
      if (!payload.titleTh.trim()) {
        setError("Title TH is required (used as Thai alt text).");
        return;
      }

      const res = await fetch(
        payload.id ? `/api/admin/hero-banners/${payload.id}` : "/api/admin/hero-banners",
        {
          method: payload.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titleTh: payload.titleTh.trim(),
            titleEn: optionalImagePayload(payload.titleEn),
            active: payload.active,
            linkUrl: payload.linkUrl.trim() || null,
            desktopTh: payload.desktopTh.trim(),
            desktopEn: optionalImagePayload(payload.desktopEn),
            mobileTh: optionalImagePayload(payload.mobileTh),
            mobileEn: optionalImagePayload(payload.mobileEn),
            panelBgHex: payload.panelBgHex.trim() === "" ? null : payload.panelBgHex.trim(),
            startsAt: datetimeLocalInputToIso(payload.startsAt),
            endsAt: datetimeLocalInputToIso(payload.endsAt),
          }),
        }
      );
      const rawText = await res.text();
      let data: { banner?: HeroBannerAdmin; error?: string } = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText) as { banner?: HeroBannerAdmin; error?: string };
        } catch {
          throw new Error("Invalid response from server");
        }
      }
      if (!res.ok || !data.banner) throw new Error(data.error ?? "Save failed");
      const saved = data.banner;
      setBanners((prev) =>
        payload.id ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved]
      );
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteById = async (id: string) => {
    if (!window.confirm("Delete this hero banner?")) return;
    const res = await fetch(`/api/admin/hero-banners/${id}`, { method: "DELETE" });
    if (res.ok) setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <>
      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Home Carousel</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Split hero: desktop{" "}
              <span className="font-medium text-zinc-600">617:712</span> uses{" "}
              <span className="font-medium text-zinc-600">cover + center</span>; mobile portrait{" "}
              <span className="font-medium text-zinc-600">392:429</span> uses{" "}
              <span className="font-medium text-zinc-600">contain</span>
              — whole image visible (panel color fills letterboxing). Mobile export 1173×1287 px matches
              392:429 with no bands inside the frame. Drag
              to reorder; first qualifying active slide is LCP. Empty schedule uses code fallback.
            </p>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add slide
          </Button>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
              No hero slides yet. Storefront uses hardcoded fallback banners.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <SortableHeroRow
                      key={banner.id}
                      banner={banner}
                      onEdit={openEdit}
                      onDelete={deleteById}
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
            <DialogTitle>{form.id ? "Edit home banner" : "Add home banner"}</DialogTitle>
            <DialogDescription>
              Title TH / Title EN are storefront alt text by locale. Desktop Thai image is required;
              optional slots fall back to Thai assets when empty. Frames are fixed:{" "}
              <span className="font-medium text-foreground">617:712</span> desktop with centered{" "}
              <span className="font-medium text-foreground">cover</span> when ratio matches;{" "}
              <span className="font-medium text-foreground">392:429</span> portrait mobile with{" "}
              <span className="font-medium text-foreground">contain</span> — full image visible. Export mobile
              at <span className="font-medium text-foreground">1173×1287 px</span> for a pixel-perfect{" "}
              <span className="font-medium text-foreground">392:429</span> frame; desktop sizes are on each
              label.
            </DialogDescription>
            <p className="text-xs text-zinc-500">
              Recommended format: WebP/PNG. We will automatically optimize your image for speed.
            </p>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title TH</Label>
              <Input
                value={form.titleTh}
                onChange={(e) => setForm({ ...form, titleTh: e.target.value })}
                placeholder="Thai alt text"
              />
            </div>
            <div className="space-y-2">
              <Label>Title EN</Label>
              <Input
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="English alt text (optional)"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Link URL</Label>
              <Input
                value={form.linkUrl}
                placeholder="/seeds/420fastbuds or https://..."
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Media panel background (hex)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={form.panelBgHex}
                  placeholder="#F4F4F5 — optional"
                  className="max-w-xs font-mono text-sm"
                  onChange={(e) => setForm({ ...form, panelBgHex: e.target.value })}
                />
                <Input
                  type="color"
                  aria-label="Pick panel background"
                  className="h-10 w-14 shrink-0 cursor-pointer p-1"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(form.panelBgHex.trim())
                      ? form.panelBgHex.trim().toUpperCase()
                      : "#f4f4f5"
                  }
                  onChange={(e) => setForm({ ...form, panelBgHex: e.target.value.toUpperCase() })}
                />
              </div>
              <p className="text-xs text-zinc-500">
                Behind the slide; visible if image aspect does not match the locked frame. Empty = light
                gray.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {IMAGE_FIELDS.map((field) => {
              const src = previewSrc(field.key);
              return (
                <div key={field.key} className="space-y-2 rounded-xl border border-zinc-200 p-3">
                  <Label>
                    {field.label}{" "}
                    <span className="text-xs font-normal text-zinc-400">{field.size}</span>
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
                  <div
                    className={cn(
                      "relative mx-auto overflow-hidden rounded-md border border-zinc-200 bg-zinc-50",
                      field.previewAspect,
                      field.key.startsWith("desktop")
                        ? "max-h-[168px] w-[116px]"
                        : "max-h-[158px] w-[112px]"
                    )}
                  >
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- blob: + arbitrary CDN previews
                      <img
                        src={src}
                        alt=""
                        className={cn(
                          "h-full w-full object-center",
                          field.key.startsWith("mobile") ? "object-contain" : "object-cover"
                        )}
                      />
                    ) : (
                      <div className="flex min-h-[72px] w-full items-center justify-center text-zinc-400">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Visible from</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
              <p className="text-xs text-zinc-500">Empty = immediately.</p>
            </div>
            <div className="space-y-2">
              <Label>Visible until</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
              <p className="text-xs text-zinc-500">Empty = no end.</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Active</p>
              <p className="text-xs text-zinc-500">Inactive slides never show on the storefront.</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm({ ...form, active: checked })}
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
