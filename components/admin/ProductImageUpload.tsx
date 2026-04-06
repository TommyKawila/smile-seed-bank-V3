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

export type ProductImageUploadProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
};

function SortableThumb({
  id,
  url,
  index,
  disabled,
  onRemove,
}: {
  id: string;
  url: string;
  index: number;
  disabled: boolean;
  onRemove: () => void;
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
        "group relative overflow-hidden rounded-xl border bg-white shadow-sm transition",
        isDragging
          ? "z-50 border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-zinc-200 hover:border-emerald-400/60",
        disabled && "opacity-60"
      )}
    >
      {index === 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          รูปหลัก · Main
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="aspect-square w-full object-cover"
        draggable={false}
      />
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute bottom-0 left-0 right-0 flex cursor-grab touch-none items-center justify-center gap-1 border-t border-zinc-200/80 bg-white/90 py-1.5 text-[10px] font-medium text-zinc-500 active:cursor-grabbing",
          disabled && "pointer-events-none"
        )}
      >
        <GripVertical className="h-3.5 w-3.5 text-emerald-700/80" />
        ลากจัดลำดับ
      </div>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        aria-label="Remove image"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductImageUpload({
  value,
  onChange,
  disabled,
  maxImages = 5,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastLine, setLastLine] = useState<string | null>(null);

  const busy = phase !== "idle";
  const count = value.length;
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
      const room = maxImages - value.length;
      const slice = files.slice(0, room);
      const nextUrls: string[] = [...value];
      for (const file of slice) {
        const url = await processOne(file);
        if (url) nextUrls.push(url);
        else break;
      }
      if (nextUrls.length > value.length) onChange(nextUrls);
    },
    [canAdd, maxImages, onChange, processOne, value]
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
    const oldIndex = value.indexOf(String(active.id));
    const newIndex = value.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, j) => j !== i));
    setLocalError(null);
  };

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

      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {value.map((url, i) => (
                <SortableThumb
                  key={`${i}-${url}`}
                  id={url}
                  url={url}
                  index={i}
                  disabled={disabled || busy}
                  onRemove={() => removeAt(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
