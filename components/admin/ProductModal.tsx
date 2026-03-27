"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Wand2, Plus, Trash2, Loader2, ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useProducts, type ProductFormData } from "@/hooks/useProducts";
import { useBreeders } from "@/hooks/useBreeders";
import { unknownFields } from "@/lib/validations/product";
import { packSizeNum, toVariantSku } from "@/lib/sku-utils";
import { processAndUploadImages } from "@/lib/supabase/storage-utils";

const MAX_IMAGES = 5;

// ── Helpers for JSONB array fields ────────────────────────────────────────────
const toStr = (v: unknown): string => {
  if (!v) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "string") return v;
  return "";
};
const toArr = (s: string): string[] =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

// Highlights fields containing the sentinel value "Unknown"
const isUnknown = (v: unknown): boolean => {
  if (v === "Unknown") return true;
  if (Array.isArray(v)) return v.some((x) => x === "Unknown");
  return false;
};
const unknownCls = (v: unknown) =>
  isUnknown(v) ? "border-red-400 text-red-600 font-bold placeholder:text-red-300" : "";

// ── Reusable tag-style textarea ───────────────────────────────────────────────
function TagField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: unknown;
  onChange: (arr: string[]) => void;
  placeholder?: string;
}) {
  const strVal = toStr(value);
  const unk = isUnknown(value);
  return (
    <div className="space-y-1">
      <Label className={`text-xs ${unk ? "text-red-600" : ""}`}>
        {label} {unk && <span className="font-bold">⚠ Unknown</span>}
      </Label>
      <input
        type="text"
        defaultValue={strVal}
        onBlur={(e) => onChange(toArr(e.target.value))}
        placeholder={placeholder ?? "คั่นด้วยจุลภาค เช่น Relaxed, Happy, Euphoric"}
        className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
          unk
            ? "border-red-400 text-red-600 font-bold"
            : "border-zinc-200"
        }`}
      />
    </div>
  );
}

import type { ProductFull } from "@/types/supabase";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ProductFull | null;
}

const emptyVariant = { unit_label: "", price: 0, cost_price: 0, stock: 0, low_stock_threshold: 5, is_active: true, sku: null as string | null };

const emptyForm: Partial<ProductFormData> = {
  name: "",
  category: null,
  category_id: null,
  breeder_id: null,
  master_sku: null,
  is_active: true,
  variants: [{ ...emptyVariant }],
};


export function ProductModal({ open, onClose, initialData }: ProductModalProps) {
  const { createProduct, validationErrors, isSubmitting, error: submitError } = useProducts({
    autoFetch: false,
  });
  const { breeders } = useBreeders();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const isEditMode = !!initialData;

  // ── Product image slots (primary images + AI source) ──────────────────────
  type ImageSlot = { preview: string; file: File | null; url: string | null };
  const urlToSlot = (url: string | null | undefined): ImageSlot | null =>
    url ? { preview: url, file: null, url } : null;

  const [productSlots, setProductSlots] = useState<ImageSlot[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "compress" | "upload">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const [aiText, setAiText] = useState("");
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitLocalError, setSubmitLocalError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [form, setForm] = useState<Partial<ProductFormData>>(emptyForm);

  // ── Populate form + slots when modal opens ──────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const p = initialData as (typeof initialData & { image_url_4?: string | null; image_url_5?: string | null }) | null;
    if (p) {
      const firstVariantSku = p.product_variants?.[0] ? (p.product_variants[0] as { sku?: string | null }).sku : null;
      const derivedMasterSku = firstVariantSku?.replace(/-?\d+$/, "") ?? "";
      const catId = (p as { category_id?: number | bigint | null }).category_id;
      setForm({
        name: p.name,
        category: p.category ?? null,
        category_id: catId != null ? Number(catId) : null,
        breeder_id: p.breeder_id,
        master_sku: (p as { master_sku?: string | null }).master_sku ?? (derivedMasterSku || null),
        description_th: p.description_th,
        description_en: p.description_en,
        image_url: p.image_url,
        image_url_2: p.image_url_2,
        image_url_3: p.image_url_3,
        image_url_4: p.image_url_4 ?? null,
        image_url_5: p.image_url_5 ?? null,
        video_url: p.video_url,
        is_active: p.is_active,
        thc_percent: p.thc_percent,
        cbd_percent: p.cbd_percent,
        genetics: p.genetics,
        indica_ratio: p.indica_ratio,
        sativa_ratio: p.sativa_ratio,
        strain_dominance: (p as { strain_dominance?: string | null }).strain_dominance ?? null,
        flowering_type: p.flowering_type,
        seed_type: p.seed_type,
        yield_info: p.yield_info,
        growing_difficulty: p.growing_difficulty,
        effects: p.effects,
        flavors: p.flavors,
        medical_benefits: p.medical_benefits,
        genetic_ratio: (p as { genetic_ratio?: string | null }).genetic_ratio ?? null,
        sex_type: (p as { sex_type?: string | null }).sex_type ?? null,
        lineage: (p as { lineage?: string | null }).lineage ?? null,
        terpenes: (p as { terpenes?: unknown }).terpenes ?? null,
        variants: p.product_variants?.map((v) => ({
          unit_label: v.unit_label,
          price: v.price,
          cost_price: v.cost_price,
          stock: v.stock,
          low_stock_threshold: (v as { low_stock_threshold?: number | null }).low_stock_threshold ?? 5,
          is_active: v.is_active,
          sku: (v as { sku?: string | null }).sku ?? null,
        })) ?? [{ ...emptyVariant }],
      });
      // Prefer image_urls JSONB array, fallback to separate columns
      const existingUrls: string[] =
        Array.isArray(p.image_urls) && p.image_urls.length > 0
          ? (p.image_urls as string[])
          : ([p.image_url, p.image_url_2, p.image_url_3, p.image_url_4, p.image_url_5]
              .filter(Boolean) as string[]);
      setProductSlots(
        existingUrls.map((url) => urlToSlot(url)).filter((s): s is ImageSlot => s !== null)
      );
    } else {
      setForm(emptyForm);
      setProductSlots([]);
    }
    setAiText("");
    setAiError(null);
    setSubmitLocalError(null);
    setFormKey((k) => k + 1);
  }, [open, initialData]);

  const variants = form.variants ?? [{ ...emptyVariant }];

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setVariant = (index: number, field: string, value: unknown) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setField("variants", updated as ProductFormData["variants"]);
  };

  const addVariant = () =>
    setField("variants", [...variants, { ...emptyVariant }] as ProductFormData["variants"]);

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setField("variants", variants.filter((_, i) => i !== index) as ProductFormData["variants"]);
  };

  // ── Image slot helpers ────────────────────────────────────────────────────
  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleProductImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - productSlots.length;
    if (remaining <= 0) return;
    const toProcess = Array.from(files).slice(0, remaining);
    const newSlots: ImageSlot[] = await Promise.all(
      toProcess.map(async (file) => ({
        preview: await readAsBase64(file),
        file,
        url: null,
      }))
    );
    setProductSlots((prev) => [...prev, ...newSlots]);
  };

  const removeProductSlot = (index: number) =>
    setProductSlots((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleProductImageFiles(e.dataTransfer.files);
  };

  // ── AI Extraction ─────────────────────────────────────────────────────────
  const handleAiExtract = async () => {
    // Use product slot previews (base64) as AI images
    const aiImages = productSlots
      .filter((s) => s.preview.startsWith("data:"))
      .map((s) => s.preview);
    if (!aiText.trim() && aiImages.length === 0) return;
    setIsExtracting(true);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: aiText,
          provider: aiProvider,
          images: aiImages,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json?.error ?? "AI ส่งผลลัพธ์ไม่ได้");
      } else {
        setForm((prev) => ({ ...prev, ...json }));
      }
    } catch {
      setAiError("เชื่อมต่อ AI ไม่ได้ กรุณาลองใหม่");
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Collect image URLs from slots (upload new files first) ──────────────────
  const resolveImageUrls = async (): Promise<string[]> => {
    const newFileSlots = productSlots.filter((s) => s.file !== null);
    const newFiles = newFileSlots.map((s) => s.file as File);
    const replaceUrls = newFileSlots.map((s) =>
      s.url && /^https?:\/\//.test(s.url) ? s.url : undefined
    );
    let uploadedUrls: string[] = [];
    if (newFiles.length > 0) {
      setIsUploading(true);
      setUploadPhase("compress");
      const productKey =
        initialData?.id != null && Number(initialData.id) > 0
          ? String(initialData.id)
          : (form.master_sku || form.name || `new-${Date.now()}`).toString();
      try {
        uploadedUrls = await processAndUploadImages(newFiles, {
          productKey,
          replaceUrls,
          onPhase: (p) => setUploadPhase(p),
        });
      } finally {
        setUploadPhase("idle");
        setIsUploading(false);
      }
    }
    let uploadIdx = 0;
    return productSlots.map((s) => {
      if (s.url) return s.url;
      return uploadedUrls[uploadIdx++] ?? "";
    }).filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLocalError(null);

    // Upload any new image files and get all URLs
    let imageUrls: string[] = [];
    try {
      imageUrls = await resolveImageUrls();
    } catch (err) {
      setSubmitLocalError(`อัปโหลดรูปภาพล้มเหลว: ${String(err)}`);
      return;
    }

    const imageFields: Partial<ProductFormData> = {
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      image_url: imageUrls[0] ?? null,
      image_url_2: imageUrls[1] ?? null,
      image_url_3: imageUrls[2] ?? null,
      image_url_4: imageUrls[3] ?? null,
      image_url_5: imageUrls[4] ?? null,
    };
    const formWithImages = { ...form, ...imageFields } as ProductFormData;
    const masterSkuVal = (formWithImages.master_sku ?? "").toString().trim();
    if (masterSkuVal) {
      formWithImages.variants = formWithImages.variants.map((v) => ({
        ...v,
        sku: toVariantSku(masterSkuVal, v.unit_label),
      }));
    }

    if (isEditMode && initialData) {
      // ── PATCH mode ──────────────────────────────────────────────────────────
      try {
        const res = await fetch(`/api/admin/products/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formWithImages),
        });
        const json = await res.json();
        if (!res.ok) {
          setSubmitLocalError(json?.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
        onClose();
      } catch (err) {
        setSubmitLocalError(String(err));
      }
    } else {
      // ── POST mode ───────────────────────────────────────────────────────────
      const result = await createProduct(formWithImages as ProductFormData);
      if (result) onClose();
    }
  };

  const getFieldError = (field: string) => {
    if (!validationErrors) return null;
    return validationErrors.issues.find((e) => e.path.includes(field))?.message ?? null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `✏️ แก้ไข: ${initialData?.name ?? "สินค้า"}` : "เพิ่มสินค้าใหม่"}
          </DialogTitle>
        </DialogHeader>

        {/* AI Extraction Box */}
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-primary">AI ช่วยกรอกข้อมูล</p>
            <Badge className="text-xs">เร็วกว่า 10x</Badge>
          </div>
          <p className="mb-2 text-xs text-zinc-500">
            วางข้อความดิบจากเว็บ Breeder แล้วให้ AI สกัดข้อมูลสินค้า (THC, CBD, Genetics ฯลฯ) เติมฟอร์มให้อัตโนมัติ
          </p>
          <Textarea
            placeholder="วางข้อความ/Description จากเว็บ Breeder ที่นี่... (ไม่บังคับ ถ้ามีรูปแล้ว)"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={3}
            className="mb-3 bg-white text-sm"
          />

          {productSlots.length > 0 && (
            <p className="mb-2 text-[11px] text-primary/80">
              📷 {productSlots.filter(s => s.preview.startsWith("data:")).length} รูปใหม่ที่เลือก · AI จะอ่านรูปอัตโนมัติเมื่อกด Wand
            </p>
          )}

          {/* Provider Toggle + Extract Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-zinc-200 bg-white text-xs font-medium overflow-hidden">
              <button
                type="button"
                onClick={() => setAiProvider("gemini")}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  aiProvider === "gemini"
                    ? "bg-primary text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>✨</span> Gemini 1.5
              </button>
              <button
                type="button"
                onClick={() => setAiProvider("openai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-zinc-200 transition-colors ${
                  aiProvider === "openai"
                    ? "bg-primary text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>🤖</span> GPT-4o mini
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiExtract}
              disabled={isExtracting || (!aiText.trim() && productSlots.filter(s => s.preview.startsWith("data:")).length === 0)}
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              {isExtracting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {productSlots.some(s => s.file) ? "กำลังวิเคราะห์ภาพ..." : "กำลังสกัดข้อมูล..."}
                </>
              ) : (
                <><Wand2 className="mr-1.5 h-3.5 w-3.5" /> สกัดข้อมูลด้วย AI</>
              )}
            </Button>
          </div>

          {aiError && (
            <p className="mt-2 text-xs text-red-500">⚠️ {aiError}</p>
          )}
        </div>

        <Separator />

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">ชื่อสินค้า *</Label>
              <Input
                id="name"
                value={form.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="เช่น Blue Dream Auto"
              />
              {getFieldError("name") && (
                <p className="text-xs text-red-500">{getFieldError("name")}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">หมวดหมู่ (Seed Type)</Label>
              <select
                id="category"
                value={form.category_id ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setField("category_id", v ? Number(v) : null);
                  const cat = categories.find((c) => c.id === v);
                  setField("category", cat?.name ?? null);
                }}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— ไม่ระบุ —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Breeder Selection */}
          <div className="space-y-1">
            <Label htmlFor="breeder">Breeder (แบรนด์)</Label>
            {breeders.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                ⚠️ ยังไม่มี Breeder ในระบบ —{" "}
                <Link href="/admin/breeders" className="font-semibold underline hover:text-amber-900">
                  สร้าง Breeder ก่อน
                </Link>
              </div>
            ) : (
              <select
                id="breeder"
                value={form.breeder_id ?? ""}
                onChange={(e) =>
                  setField("breeder_id", e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— ไม่ระบุ Breeder —</option>
                {breeders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Master SKU — Read-only after creation to prevent broken links */}
          <div className="space-y-1">
            <Label htmlFor="master_sku">Master SKU</Label>
            <Input
              id="master_sku"
              value={form.master_sku ?? ""}
              onChange={(e) => !isEditMode && setField("master_sku", e.target.value.trim() || null)}
              placeholder="เช่น 420FASTBUDS-RAINBOW-MELON (ตัวพิมพ์ใหญ่, variants เป็น …-1, …-3, …-5)"
              className="font-mono text-sm"
              readOnly={isEditMode}
            />
          </div>

          {/* Description TH/EN */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="desc_th" className={isUnknown(form.description_th) ? "text-red-600" : ""}>
                คำบรรยาย (ภาษาไทย){isUnknown(form.description_th) && " ⚠"}
              </Label>
              <Textarea
                id="desc_th"
                value={form.description_th ?? ""}
                onChange={(e) => setField("description_th", e.target.value)}
                rows={4}
                placeholder="คำบรรยายสินค้าภาษาไทย..."
                className={unknownCls(form.description_th)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc_en" className={isUnknown(form.description_en) ? "text-red-600" : ""}>
                Description (English){isUnknown(form.description_en) && " ⚠"}
              </Label>
              <Textarea
                id="desc_en"
                value={form.description_en ?? ""}
                onChange={(e) => setField("description_en", e.target.value)}
                rows={4}
                placeholder="Product description in English..."
                className={unknownCls(form.description_en)}
              />
            </div>
          </div>

          {/* Product Image Upload Zone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                📸 รูปภาพสินค้า ({productSlots.length}/{MAX_IMAGES})
              </Label>
              {productSlots.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => productFileInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> เพิ่มรูป
                </button>
              )}
            </div>
            <input
              ref={productFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleProductImageFiles(e.target.files)}
            />
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => productSlots.length < MAX_IMAGES && productFileInputRef.current?.click()}
              className={`min-h-[100px] rounded-xl border-2 border-dashed p-3 transition-colors cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-zinc-200 bg-zinc-50 hover:border-primary/50"
              }`}
            >
              {productSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-4 text-zinc-400">
                  <ImagePlus className="h-8 w-8 opacity-40" />
                  <p className="text-xs font-medium">ลากรูปมาวาง หรือคลิกเพื่อเลือก</p>
                  <p className="text-[10px] opacity-70">สูงสุด 5 รูป · WebP · ความกว้างไม่เกิน 1200px · ~80% quality</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {productSlots.map((slot, i) => (
                    <div key={i} className="relative h-20 w-20 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Image
                        src={slot.preview}
                        alt={`product-img-${i + 1}`}
                        fill
                        className="rounded-xl object-cover border-2 border-zinc-200"
                        unoptimized={slot.preview.startsWith("data:")}
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-primary/80 py-0.5 text-center text-[9px] font-bold text-white">
                          หลัก
                        </span>
                      )}
                      {slot.file && (
                        <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white" title="รูปใหม่ (จะ compress ก่อน upload)" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeProductSlot(i)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {isDragging && productSlots.length < MAX_IMAGES && (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-primary">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              รูปแรก = หลัก · จุดเขียว = รอ compress &amp; upload · AI อ่านรูปอัตโนมัติเมื่อกด ✨
            </p>
            {isUploading && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {uploadPhase === "compress"
                  ? "กำลังบีบอัดรูป… (Compressing)"
                  : uploadPhase === "upload"
                    ? "กำลังอัปโหลด… (Uploading)"
                    : "กำลังประมวลผลรูป… (Processing)"}
              </p>
            )}
          </div>

          {/* AI Specs Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">THC %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.thc_percent ?? ""}
                onChange={(e) => setField("thc_percent", e.target.value ? Number(e.target.value) : null)}
                placeholder="0–100"
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CBD %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.cbd_percent ?? ""}
                onChange={(e) => setField("cbd_percent", e.target.value ? Number(e.target.value) : null)}
                placeholder="0–100"
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ประเภทพันธุกรรม (Genetics)</Label>
              <select
                value={form.strain_dominance ?? ""}
                onChange={(e) =>
                  setField("strain_dominance", (e.target.value || null) as "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50" | null)
                }
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                <option value="Mostly Indica">Mostly Indica</option>
                <option value="Hybrid 50/50">Hybrid 50/50</option>
                <option value="Mostly Sativa">Mostly Sativa</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Flowering Type</Label>
              <select
                value={form.flowering_type ?? ""}
                onChange={(e) =>
                  setField("flowering_type", (e.target.value || null) as "AUTO" | "PHOTO" | null)
                }
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                <option value="AUTO">AUTO</option>
                <option value="PHOTO">PHOTO</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seed Type</Label>
              <select
                value={form.seed_type ?? ""}
                onChange={(e) =>
                  setField("seed_type", (e.target.value || null) as "FEMINIZED" | "REGULAR" | null)
                }
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                <option value="FEMINIZED">FEMINIZED</option>
                <option value="REGULAR">REGULAR</option>
              </select>
            </div>
          </div>

          {/* Yield & Difficulty */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className={`text-xs ${isUnknown(form.yield_info) ? "text-red-600" : ""}`}>
                🌿 Yield (ผลผลิต){isUnknown(form.yield_info) && " ⚠"}
              </Label>
              <Input
                value={form.yield_info ?? ""}
                onChange={(e) => setField("yield_info", e.target.value || null)}
                placeholder="400-500g/m² · Up to 600g/plant"
                className={`text-sm ${unknownCls(form.yield_info)}`}
              />
            </div>
            <div className="space-y-1">
              <Label className={`text-xs ${isUnknown(form.growing_difficulty) ? "text-red-600" : ""}`}>
                🏋️ Growing Difficulty{isUnknown(form.growing_difficulty) && " ⚠"}
              </Label>
              <select
                value={form.growing_difficulty ?? ""}
                onChange={(e) => setField("growing_difficulty", e.target.value || null)}
                className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  isUnknown(form.growing_difficulty)
                    ? "border-red-400 text-red-600 font-bold"
                    : "border-zinc-200"
                }`}
              >
                <option value="">— ไม่ระบุ —</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Experienced">Experienced</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          {/* Extended Specs Row 2: Lineage, Genetic Ratio, Sex Type */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className={`text-xs ${isUnknown(form.lineage) ? "text-red-600" : ""}`}>
                Lineage{isUnknown(form.lineage) && " ⚠"}
              </Label>
              <Input
                value={form.lineage ?? ""}
                onChange={(e) => setField("lineage", e.target.value || null)}
                placeholder="OG Kush × White Widow"
                className={`text-sm ${unknownCls(form.lineage)}`}
              />
            </div>
            <div className="space-y-1">
              <Label className={`text-xs ${isUnknown(form.genetic_ratio) ? "text-red-600" : ""}`}>
                Genetic Ratio{isUnknown(form.genetic_ratio) && " ⚠"}
              </Label>
              <Input
                value={form.genetic_ratio ?? ""}
                onChange={(e) => setField("genetic_ratio", e.target.value || null)}
                placeholder="Sativa 70% / Indica 30%"
                className={`text-sm ${unknownCls(form.genetic_ratio)}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sex Type</Label>
              <select
                value={form.sex_type ?? ""}
                onChange={(e) => setField("sex_type", e.target.value || null)}
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                <option value="Feminized">Feminized</option>
                <option value="Regular">Regular</option>
                <option value="Autoflower">Autoflower</option>
              </select>
            </div>
          </div>

          {/* Tag fields: Terpenes, Effects, Flavors, Medical */}
          <div key={formKey} className="grid gap-3 sm:grid-cols-2">
            <TagField
              label="🌿 Terpenes"
              value={form.terpenes}
              onChange={(arr) => setField("terpenes", arr.length ? arr : null)}
              placeholder="Myrcene, Limonene, Caryophyllene"
            />
            <TagField
              label="⚡ Effects (ผล)"
              value={form.effects}
              onChange={(arr) => setField("effects", arr.length ? arr : null)}
              placeholder="Relaxed, Happy, Euphoric"
            />
            <TagField
              label="🍋 Flavors (รสชาติ)"
              value={form.flavors}
              onChange={(arr) => setField("flavors", arr.length ? arr : null)}
              placeholder="Earthy, Pine, Sweet"
            />
            <TagField
              label="💊 Medical Benefits"
              value={form.medical_benefits}
              onChange={(arr) => setField("medical_benefits", arr.length ? arr : null)}
              placeholder="Stress, Pain, Anxiety"
            />
          </div>

          <Separator />

          {/* Variants — Price/Stock editable only when creating; use Inventory for existing products */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-semibold">แพ็กเกจ / Variants *</Label>
              {isEditMode && (
                <Link href={`/admin/inventory/manual${form.breeder_id ? `?breederId=${form.breeder_id}` : ""}`}>
                  <Button type="button" variant="outline" size="sm" className="text-xs">
                    Update Stock/Price ใน Inventory
                  </Button>
                </Link>
              )}
              {!isEditMode && (
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> เพิ่มแพ็ก
                </Button>
              )}
            </div>
            {getFieldError("variants") && (
              <p className="mb-2 text-xs text-red-500">{getFieldError("variants")}</p>
            )}
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-end gap-2 rounded-lg border border-zinc-200 p-3"
                >
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">ขนาด</Label>
                    <Input
                      placeholder="1 Seed"
                      value={v.unit_label}
                      onChange={(e) => setVariant(i, "unit_label", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">ราคาขาย (฿)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={v.price}
                      onChange={(e) => !isEditMode && setVariant(i, "price", Number(e.target.value))}
                      className="text-sm"
                      readOnly={isEditMode}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">ราคาต้นทุน (฿)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={v.cost_price}
                      onChange={(e) => !isEditMode && setVariant(i, "cost_price", Number(e.target.value))}
                      className="text-sm"
                      readOnly={isEditMode}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">สต็อก</Label>
                    <Input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => !isEditMode && setVariant(i, "stock", Number(e.target.value))}
                      className="text-sm"
                      readOnly={isEditMode}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs" title="แจ้งเตือนเมื่อสต็อก ≤">ต่ำ≤</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(v as { low_stock_threshold?: number }).low_stock_threshold ?? 5}
                      onChange={(e) => setVariant(i, "low_stock_threshold", Number(e.target.value) || 5)}
                      className="text-sm w-14"
                      placeholder="5"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">SKU</Label>
                    <div className="min-h-[2.25rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
                      {(form.master_sku ?? "").trim()
                        ? toVariantSku((form.master_sku ?? "").trim(), v.unit_label)
                        : (v.sku ?? "—")}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end justify-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setVariant(i, "is_active", !v.is_active)
                      }
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        v.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {v.is_active ? "เปิด" : "ปิด"}
                    </button>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="rounded p-1 text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unknown Fields Warning */}
          {(() => {
            const unk = unknownFields(form);
            if (unk.length === 0) return null;
            return (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ⚠️ <strong>ยังมีข้อมูลที่ต้องกรอกเพิ่ม ({unk.length} ฟิลด์):</strong>{" "}
                <span className="font-medium text-red-600">{unk.join(", ")}</span>
                <br />
                <span className="text-xs text-amber-700">ฟิลด์เหล่านี้มีค่าว่า &quot;Unknown&quot; — สามารถบันทึกได้ แต่ควรแก้ไขก่อนเผยแพร่</span>
              </div>
            );
          })()}

          {/* Submit Error Banner */}
          {(submitError || submitLocalError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ <strong>บันทึกไม่สำเร็จ:</strong> {submitLocalError ?? submitError}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/90">
              {isSubmitting ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> กำลังบันทึก...</>
              ) : (
                isEditMode ? "บันทึกการแก้ไข" : "บันทึกสินค้า"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
