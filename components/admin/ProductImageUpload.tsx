"use client";

import { useCallback, useRef, useState } from "react";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import {
  uploadProductImage,
  validateMagazineImageOriginal,
  validateMagazineImageFile,
  MAGAZINE_ORIGINAL_MAX_BYTES,
  MAGAZINE_IMAGE_ALLOWED_TYPES,
} from "@/lib/supabase-upload";

const ALLOWED_MIME = new Set<string>(MAGAZINE_IMAGE_ALLOWED_TYPES);
import {
  compressImageForMagazineUpload,
  formatImageBytes,
} from "@/lib/image-optimizer";
import { cn } from "@/lib/utils";

type Phase = "idle" | "optimizing" | "uploading";

const ACCEPT =
  "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

export type ProductGalleryEntry = {
  id: string;
  url: string;
  is_main: boolean;
  variant_unit_label: string | null;
};

export type ProductImageUploadProps = {
  entries: ProductGalleryEntry[];
  onChange: (entries: ProductGalleryEntry[]) => void;
  /** Pack labels from current variant rows (e.g. "1 Seed") */
  variantLabels: string[];
  disabled?: boolean;
  maxImages?: number;
};

function SortableThumb({
  id,
  url,
  entry,
  variantLabels,
  disabled,
  onRemove,
  onSetMain,
  onVariantLabel,
}: {
  id: string;
  url: string;
  entry: ProductGalleryEntry;
  variantLabels: string[];
  disabled: boolean;
  onRemove: () => void;
  onSetMain: () => void;
  onVariantLabel: (label: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition",
        isDragging
          ? "z-50 border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-zinc-200 hover:border-emerald-400/60",
        disabled && "opacity-60"
      )}
    >
      {entry.is_main ? (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          รูปร้าน · Shop listing
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="aspect-square w-full object-cover"
        draggable={false}
      />
      <div className="space-y-1 border-t border-zinc-100 bg-zinc-50/90 px-2 py-1.5">
        <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-medium text-zinc-600">
          <input
            type="radio"
            name="product-gallery-main"
            className="accent-emerald-700"
            checked={entry.is_main}
            disabled={disabled}
            onChange={onSetMain}
          />
          Main thumbnail
        </label>
        <label className="block text-[9px] font-medium uppercase tracking-wide text-zinc-500">
          Pack image
          <select
            className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-1 py-1 text-[11px] text-zinc-800"
            value={entry.variant_unit_label ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onVariantLabel(e.target.value.trim() || null)
            }
          >
            <option value="">— None (gallery only) —</option>
            {variantLabels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex cursor-grab touch-none items-center justify-center gap-1 border-t border-zinc-200/80 bg-white/90 py-1 text-[10px] font-medium text-zinc-500 active:cursor-grabbing",
          disabled && "pointer-events-none"
        )}
      >
        <GripVertical className="h-3.5 w-3.5 text-emerald-700/80" />
        Drag
      </div>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-1.5 top-8 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        aria-label="Remove image"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductImageUpload({
  entries,
  onChange,
  variantLabels,
  disabled,
  maxImages = 5,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastLine, setLastLine] = useState<string | null>(null);

  const busy = phase !== "idle";
  const count = entries.length;
  const atLimit = count >= maxImages;
  const canAdd = !atLimit && !disabled && !busy;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const processOne = useCallback(
    async (file: File): Promise<string | null> => {
      const pre = validateMagazineImageOriginal(file);
      if (pre) {
        setLocalError(pre);
        return null;
      }
      setPhase("optimizing");
      let compressed: File;
      let bytesBefore: number;
      let bytesAfter: number;
      try {
        const r = await compressImageForMagazineUpload(file);
        compressed = r.file;
        bytesBefore = r.bytesBefore;
        bytesAfter = r.bytesAfter;
      } catch (e) {
        setPhase("idle");
        setLocalError(e instanceof Error ? e.message : "Optimization failed");
        return null;
      }
      const post = validateMagazineImageFile(compressed);
      if (post) {
        setPhase("idle");
        setLocalError(post);
        return null;
      }
      setLastLine(
        `Compressed: ${formatImageBytes(bytesBefore)} → ${formatImageBytes(bytesAfter)}`
      );
      setPhase("uploading");
      const res = await uploadProductImage(compressed);
      setPhase("idle");
      if ("error" in res) {
        setLocalError(res.error);
        return null;
      }
      return res.url;
    },
    []
  );

  const runBatch = useCallback(
    async (files: File[]) => {
      if (!canAdd || files.length === 0) return;
      setLocalError(null);
      const room = maxImages - entries.length;
      const slice = files.slice(0, room);
      const next = [...entries];
      for (const file of slice) {
        const url = await processOne(file);
        if (!url) break;
        const isOnly = next.length === 0;
        next.push({
          id: crypto.randomUUID(),
          url,
          is_main: isOnly,
          variant_unit_label: null,
        });
      }
      if (next.length > entries.length) {
        if (!next.some((e) => e.is_main)) {
          next[0] = { ...next[0], is_main: true };
        }
        onChange(next);
      }
    },
    [canAdd, maxImages, onChange, processOne, entries]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) void runBatch(Array.from(list));
    e.target.value = "";
  };

  const onDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!canAdd) return;
    const dt = e.dataTransfer.files;
    if (dt?.length) {
      const imageFiles = Array.from(dt).filter((f) => ALLOWED_MIME.has(f.type));
      if (imageFiles.length === 0) {
        setLocalError("Use PNG, JPG, JPEG, or WebP.");
        return;
      }
      void runBatch(imageFiles);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = entries.map((e) => e.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(entries, oldIndex, newIndex));
  };

  const removeAt = (i: number) => {
    const next = entries.filter((_, j) => j !== i);
    if (next.length && !next.some((e) => e.is_main)) {
      next[0] = { ...next[0], is_main: true };
    }
    onChange(next);
    setLocalError(null);
  };

  const setMain = (id: string) => {
    onChange(
      entries.map((e) => ({
        ...e,
        is_main: e.id === id,
      }))
    );
  };

  const setVariantFor = (id: string, label: string | null) => {
    onChange(
      entries.map((e) =>
        e.id === id ? { ...e, variant_unit_label: label } : e
      )
    );
  };

  const sortableIds = entries.map((e) => e.id);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          Gallery
        </span>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            atLimit ? "text-emerald-800" : "text-zinc-500"
          )}
        >
          {count}/{maxImages}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={disabled || busy || atLimit}
        onChange={onPick}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (canAdd) inputRef.current?.click();
          }
        }}
        onClick={() => canAdd && inputRef.current?.click()}
        onDrop={onDropFiles}
        onDragOver={(e) => {
          e.preventDefault();
          if (canAdd) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        className={cn(
          "rounded-xl border border-dashed px-4 py-6 transition",
          dragOver && canAdd
            ? "border-emerald-500 bg-emerald-50/80"
            : "border-zinc-200 bg-zinc-50 hover:border-emerald-400/50",
          (!canAdd || busy) && "pointer-events-none opacity-60"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {busy ? (
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          ) : (
            <ImagePlus className="h-8 w-8 text-zinc-400" strokeWidth={1.25} />
          )}
          <p className="text-sm text-zinc-700">
            {busy
              ? phase === "optimizing"
                ? "กำลังบีบอัด…"
                : "กำลังอัปโหลด…"
              : atLimit
                ? "ครบจำนวนสูงสุดแล้ว"
                : "ลากหลายไฟล์มาวาง หรือคลิกเลือกได้หลายรูป"}
          </p>
          <p className="text-[11px] text-zinc-500">
            PNG, JPG, WebP · ต้นฉบับ ≤{" "}
            {Math.round(MAGAZINE_ORIGINAL_MAX_BYTES / (1024 * 1024))}MB · หลังบีบ ≤0.8MB ·
            1200px
          </p>
        </div>
      </div>

      {localError && (
        <p className="text-sm text-red-600" role="alert">
          {localError}
        </p>
      )}
      {lastLine && !localError && (
        <p className="text-xs text-emerald-700">{lastLine}</p>
      )}

      {entries.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entries.map((entry, i) => (
                <SortableThumb
                  key={entry.id}
                  id={entry.id}
                  url={entry.url}
                  entry={entry}
                  variantLabels={variantLabels}
                  disabled={disabled || busy}
                  onRemove={() => removeAt(i)}
                  onSetMain={() => setMain(entry.id)}
                  onVariantLabel={(l) => setVariantFor(entry.id, l)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
