"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Wand2, Plus, Trash2, Loader2, ImagePlus, X, Sparkles, Gem } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useProducts, type ProductFormData } from "@/hooks/useProducts";
import { useBreeders } from "@/hooks/useBreeders";
import { unknownFields } from "@/lib/validations/product";
import { packSizeNum, toVariantSku } from "@/lib/sku-utils";
import { processAndUploadImages } from "@/lib/supabase/storage-utils";
import { useToast } from "@/hooks/use-toast";
import { normalizeFloweringFromDb, normalizeSexFromDb } from "@/lib/cannabis-attributes";

const MAX_IMAGES = 5;
const AI_SCAN_STAGING_MAX = 5;

type AiStagingItem = { key: string; preview: string; file: File };
const AI_EXTRACT_URL = "/api/ai/extract";
const AI_SCAN_MAX_FILE_BYTES = 5 * 1024 * 1024;

const AI_SCAN_LOADING_MESSAGES = [
  "กำลังวิเคราะห์สายพันธุ์... (Analyzing genetics...)",
  "กำลังคำนวณค่า THC & CBD... (Calculating THC & CBD...)",
  "กำลังถอดรหัสข้อมูลจากรูปภาพ... (Decoding image data...)",
  "Smile Seed AI กำลังใช้ความคิด... (Smile Seed AI is thinking...)",
  "กำลังสกัดข้อมูลจาก Breeder... (Extracting breeder info...)",
] as const;

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

function toInt0to100(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

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
import { generateSlug } from "@/lib/product-utils";
import {
  formatGeneticRatioString,
  normalizeSativaIndicaPercents,
} from "@/lib/genetic-percent-utils";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ProductFull | null;
}

const emptyVariant = { unit_label: "", price: 0, cost_price: 0, stock: 0, low_stock_threshold: 5, is_active: true, sku: null as string | null };

const emptyForm: Partial<ProductFormData> = {
  name: "",
  slug: "",
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
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const isEditMode = !!initialData;

  // ── Product image slots (marketing gallery only — not sent to AI) ─────────
  type ImageSlot = { preview: string; file: File | null; url: string | null };
  const urlToSlot = (url: string | null | undefined): ImageSlot | null =>
    url ? { preview: url, file: null, url } : null;

  const [productSlots, setProductSlots] = useState<ImageSlot[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "compress" | "upload">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const aiScanFileInputRef = useRef<HTMLInputElement>(null);
  const aiScanStagingRef = useRef<AiStagingItem[]>([]);

  const [isAiScanDragging, setIsAiScanDragging] = useState(false);
  const [aiScanStaging, setAiScanStaging] = useState<AiStagingItem[]>([]);

  const [aiText, setAiText] = useState("");
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  /** null = idle; scanner = image Read & Discard; wand = text-only extract */
  const [aiPending, setAiPending] = useState<"scanner" | "wand" | null>(null);
  const [aiScanMessageIx, setAiScanMessageIx] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitLocalError, setSubmitLocalError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const slugTouchedRef = useRef(false);

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
    slugTouchedRef.current = false;
    const p = initialData as (typeof initialData & { image_url_4?: string | null; image_url_5?: string | null }) | null;
    if (p) {
      const firstVariantSku = p.product_variants?.[0] ? (p.product_variants[0] as { sku?: string | null }).sku : null;
      const derivedMasterSku = firstVariantSku?.replace(/-?\d+$/, "") ?? "";
      const catId = (p as { category_id?: number | bigint | null }).category_id;
      let floweringNorm = normalizeFloweringFromDb(p.flowering_type);
      let sexNorm = normalizeSexFromDb((p as { sex_type?: string | null }).sex_type);
      const sexLegacy = String((p as { sex_type?: string | null }).sex_type ?? "").toLowerCase();
      if (!sexNorm && p.seed_type) {
        const st = String(p.seed_type).toUpperCase();
        if (st === "FEMINIZED" || st === "FEM") sexNorm = "feminized";
        else if (st === "REGULAR" || st === "REG") sexNorm = "regular";
      }
      if (!floweringNorm && (sexLegacy.includes("autoflower") || sexLegacy === "auto")) {
        floweringNorm = "autoflower";
        sexNorm = sexNorm ?? "feminized";
      }
      setForm({
        name: p.name,
        slug: (p as { slug?: string | null }).slug ?? "",
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
        cbd_percent:
          p.cbd_percent != null && p.cbd_percent !== ""
            ? String(p.cbd_percent)
            : null,
        genetics: p.genetics,
        indica_ratio: p.indica_ratio,
        sativa_ratio: p.sativa_ratio,
        sativa_percent:
          toInt0to100((p as { sativa_percent?: number | null }).sativa_percent) ??
          toInt0to100(p.sativa_ratio),
        indica_percent:
          toInt0to100((p as { indica_percent?: number | null }).indica_percent) ??
          toInt0to100(p.indica_ratio),
        strain_dominance: (p as { strain_dominance?: string | null }).strain_dominance ?? null,
        flowering_type: floweringNorm,
        seed_type: p.seed_type,
        yield_info: p.yield_info,
        growing_difficulty: p.growing_difficulty,
        effects: p.effects,
        flavors: p.flavors,
        medical_benefits: p.medical_benefits,
        genetic_ratio: (p as { genetic_ratio?: string | null }).genetic_ratio ?? null,
        sex_type: sexNorm,
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
        })) ?? [],
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
    setAiScanStaging([]);
    setAiError(null);
    setSubmitLocalError(null);
    setFormKey((k) => k + 1);
  }, [open, initialData]);

  useEffect(() => {
    aiScanStagingRef.current = aiScanStaging;
  }, [aiScanStaging]);

  useEffect(() => {
    if (aiPending !== "scanner") {
      setAiScanMessageIx(0);
      return;
    }
    setAiScanMessageIx(0);
    const id = setInterval(() => {
      setAiScanMessageIx((i) => (i + 1) % AI_SCAN_LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(id);
  }, [aiPending]);

  const variants = form.variants ?? [];

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setSativaPercentInput = (raw: string) => {
    if (raw.trim() === "") {
      setForm((prev) => ({
        ...prev,
        sativa_percent: null,
        indica_percent: null,
        sativa_ratio: null,
        indica_ratio: null,
        genetic_ratio: null,
      }));
      return;
    }
    const s = Math.min(100, Math.max(0, Math.round(Number(raw))));
    const i = 100 - s;
    setForm((prev) => ({
      ...prev,
      sativa_percent: s,
      indica_percent: i,
      sativa_ratio: s,
      indica_ratio: i,
      genetic_ratio: formatGeneticRatioString(s, i),
    }));
  };

  const setIndicaPercentInput = (raw: string) => {
    if (raw.trim() === "") {
      setForm((prev) => ({
        ...prev,
        sativa_percent: null,
        indica_percent: null,
        sativa_ratio: null,
        indica_ratio: null,
        genetic_ratio: null,
      }));
      return;
    }
    const ind = Math.min(100, Math.max(0, Math.round(Number(raw))));
    const s = 100 - ind;
    setForm((prev) => ({
      ...prev,
      sativa_percent: s,
      indica_percent: ind,
      sativa_ratio: s,
      indica_ratio: ind,
      genetic_ratio: formatGeneticRatioString(s, ind),
    }));
  };

  const setSexTypeField = (v: "feminized" | "regular" | null) => {
    setForm((prev) => ({
      ...prev,
      sex_type: v,
      seed_type:
        v === "feminized" ? "FEMINIZED" : v === "regular" ? "REGULAR" : null,
    }));
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

  const runAiExtract = useCallback(
    async (opts: { rawText: string; images: string[]; source: "scanner" | "wand" }) => {
      if (!opts.rawText.trim() && opts.images.length === 0) return;
      setAiPending(opts.source);
      setAiError(null);
      try {
        const res = await fetch(AI_EXTRACT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText: opts.rawText,
            provider: aiProvider,
            images: opts.images,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setAiError(json?.error ?? "AI ส่งผลลัพธ์ไม่ได้");
          return;
        }
        setForm((prev) => {
          const next = { ...prev, ...json } as Partial<ProductFormData>;
          const sx = next.sex_type;
          if (sx === "feminized" || sx === "regular") {
            next.seed_type = sx === "feminized" ? "FEMINIZED" : "REGULAR";
          }
          const sp = next.sativa_percent ?? toInt0to100(next.sativa_ratio);
          const ip = next.indica_percent ?? toInt0to100(next.indica_ratio);
          const norm = normalizeSativaIndicaPercents(sp, ip);
          if (norm.sativa_percent != null && norm.indica_percent != null) {
            next.sativa_percent = norm.sativa_percent;
            next.indica_percent = norm.indica_percent;
            next.sativa_ratio = norm.sativa_percent;
            next.indica_ratio = norm.indica_percent;
            next.genetic_ratio = formatGeneticRatioString(
              norm.sativa_percent,
              norm.indica_percent
            );
          }
          return next;
        });
        if (opts.source === "scanner") setAiScanStaging([]);
        toast({
          title: "Data Extracted Successfully!",
          description:
            opts.source === "scanner"
              ? "Form updated from scan — image was not added to the product gallery."
              : "Form updated from text.",
        });
      } catch {
        setAiError("เชื่อมต่อ AI ไม่ได้ กรุณาลองใหม่");
      } finally {
        setAiPending(null);
      }
    },
    [aiProvider, toast]
  );

  const addAiStagingFromFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || aiPending) return;
    const room =
      AI_SCAN_STAGING_MAX - aiScanStagingRef.current.length;
    if (room <= 0) return;
    const collected: AiStagingItem[] = [];
    for (const file of Array.from(fileList)) {
      if (collected.length >= room) break;
      if (!file.type.startsWith("image/")) continue;
      if (file.size > AI_SCAN_MAX_FILE_BYTES) {
        toast({
          variant: "destructive",
          title: "ไฟล์ใหญ่เกินไป (สูงสุด 5MB)",
          description: "File too large (Max 5MB)",
        });
        continue;
      }
      const preview = await readAsBase64(file);
      if (!preview.startsWith("data:")) continue;
      collected.push({ key: crypto.randomUUID(), preview, file });
    }
    if (!collected.length) return;
    setAiScanStaging((prev) =>
      [...prev, ...collected].slice(0, AI_SCAN_STAGING_MAX)
    );
  };

  const removeAiStagingSlot = (key: string) =>
    setAiScanStaging((prev) => prev.filter((s) => s.key !== key));

  const handleAiScanFilesInput = (files: FileList | null) => {
    void addAiStagingFromFiles(files);
  };

  const handleAiScanDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAiScanDragging(false);
    if (aiPending) return;
    void addAiStagingFromFiles(e.dataTransfer.files);
  };

  const handleAiScannerExtract = () => {
    if (!aiText.trim() && aiScanStaging.length === 0) return;
    void runAiExtract({
      rawText: aiText,
      images: aiScanStaging.map((s) => s.preview).filter((x) => x.startsWith("data:")),
      source: "scanner",
    });
  };

  const handleAiWandExtract = () => {
    if (!aiText.trim()) return;
    void runAiExtract({ rawText: aiText, images: [], source: "wand" });
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
    let formWithImages = { ...form, ...imageFields } as ProductFormData;
    const sp = formWithImages.sativa_percent ?? null;
    const ip = formWithImages.indica_percent ?? null;
    if (sp != null && ip != null) {
      const norm = normalizeSativaIndicaPercents(sp, ip);
      if (norm.sativa_percent != null && norm.indica_percent != null) {
        formWithImages = {
          ...formWithImages,
          sativa_percent: norm.sativa_percent,
          indica_percent: norm.indica_percent,
          sativa_ratio: norm.sativa_percent,
          indica_ratio: norm.indica_percent,
          genetic_ratio: formatGeneticRatioString(
            norm.sativa_percent,
            norm.indica_percent
          ),
        };
      }
    }
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
      <DialogContent className="flex max-h-[90vh] min-h-0 w-[calc(100vw-1.25rem)] max-w-[calc(100vw-1.25rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px] md:max-w-[800px] lg:max-w-4xl">
        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 pb-4 pt-5 pr-12 sm:px-6 sm:pb-5 sm:pt-6 sm:pr-14">
          <DialogHeader className="pr-10">
            <DialogTitle>
              {isEditMode ? `✏️ แก้ไข: ${initialData?.name ?? "สินค้า"}` : "เพิ่มสินค้าใหม่"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-6">
        {/* AI Assistant — text wand + stateless image scanner (never touches gallery) */}
        <div className="w-full rounded-xl border border-dashed border-primary/35 bg-gradient-to-br from-primary/[0.06] to-secondary/40 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-primary">AI ช่วยกรอกข้อมูล</p>
            <Badge className="text-xs">เร็วกว่า 10x</Badge>
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            Wand = สกัดจากข้อความ · Staging สูงสุด 5 รูป แล้วกดสกัด — ไม่เข้าแกลเลอรีสินค้า
          </p>
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_minmax(11rem,15rem)] md:items-start">
            <Textarea
              placeholder="วางข้อความ/Description จากเว็บ Breeder แล้วกด «สกัดจากข้อความ»..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={4}
              className="min-h-[104px] border-zinc-200 bg-white text-sm md:min-h-[128px]"
            />
            <div className="relative flex flex-col gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold leading-tight text-secondary-foreground">
                <Sparkles className="h-3 w-3 shrink-0 text-secondary-foreground" />
                ✨ AI Data Scanner (Read & Discard)
              </span>
              <input
                ref={aiScanFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={aiPending !== null}
                onChange={(e) => {
                  handleAiScanFilesInput(e.target.files);
                  e.target.value = "";
                }}
              />
              {aiScanStaging.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiScanStaging.map((s) => (
                    <div
                      key={s.key}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-secondary-foreground/20 bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image
                        src={s.preview}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={s.preview.startsWith("data:")}
                      />
                      <button
                        type="button"
                        disabled={aiPending !== null}
                        onClick={() => removeAiStagingSlot(s.key)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-50"
                        aria-label="ลบรูป"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {aiPending === "scanner" ? (
                <div className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-secondary-foreground/25 bg-secondary/80 px-2 py-3">
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-secondary-foreground" />
                  <p className="text-center text-[9px] font-medium leading-snug text-secondary-foreground">
                    {AI_SCAN_LOADING_MESSAGES[aiScanMessageIx]}
                  </p>
                </div>
              ) : (
                aiScanStaging.length < AI_SCAN_STAGING_MAX && (
                  <div
                    onDragOver={(e) => {
                      if (aiPending) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAiScanDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAiScanDragging(false);
                    }}
                    onDrop={handleAiScanDrop}
                    onClick={() =>
                      !aiPending &&
                      aiScanStaging.length < AI_SCAN_STAGING_MAX &&
                      aiScanFileInputRef.current?.click()
                    }
                    className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-2 text-center transition-colors ${
                      isAiScanDragging
                        ? "border-secondary-foreground/35 bg-secondary/60"
                        : "border-secondary-foreground/30 bg-white/90 hover:border-secondary-foreground/35 hover:bg-secondary/50"
                    } ${aiPending && aiPending !== "scanner" ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <Sparkles className="h-5 w-5 text-secondary-foreground/60" />
                    <span className="px-0.5 text-[9px] font-medium leading-tight text-zinc-600">
                      เพิ่มรูป (สูงสุด {AI_SCAN_STAGING_MAX})
                      <br />
                      ลากหรือแตะ
                    </span>
                  </div>
                )
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiScannerExtract}
                disabled={
                  aiPending !== null || (aiScanStaging.length === 0 && !aiText.trim())
                }
                className="w-full border-secondary-foreground/35 text-secondary-foreground hover:bg-secondary"
              >
                <span className="mr-1">✨</span>
                สกัดข้อมูลจาก {aiScanStaging.length} รูป
              </Button>
              <p className="text-[8px] leading-snug text-secondary-foreground/80">
                Stateless · max 5MB/ไฟล์ · not uploaded
              </p>
            </div>
          </div>

          {/* Provider Toggle + Extract Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-zinc-200 bg-white text-xs font-medium overflow-hidden">
              <button
                type="button"
                disabled={aiPending !== null}
                onClick={() => setAiProvider("gemini")}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors disabled:opacity-50 ${
                  aiProvider === "gemini"
                    ? "bg-primary text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>✨</span> Gemini 1.5
              </button>
              <button
                type="button"
                disabled={aiPending !== null}
                onClick={() => setAiProvider("openai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-zinc-200 transition-colors disabled:opacity-50 ${
                  aiProvider === "openai"
                    ? "bg-gradient-to-r from-primary via-primary/90 to-primary text-white shadow-sm ring-1 ring-primary/40"
                    : "text-zinc-600 hover:bg-accent/90"
                }`}
              >
                <Gem className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
                GPT-4o
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiWandExtract}
              disabled={aiPending !== null || !aiText.trim()}
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              {aiPending === "wand" ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  กำลังสกัดข้อมูล…
                </>
              ) : (
                <>
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" /> สกัดจากข้อความ
                </>
              )}
            </Button>
          </div>

          {aiError && (
            <p className="mt-2 text-xs text-red-500">⚠️ {aiError}</p>
          )}
        </div>

        <Separator />

        {/* Product fields */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-sm font-medium">เปิดขาย (แสดงในร้านค้า)</Label>
              <p className="text-xs text-zinc-500">
                ปิดเมื่อยังไม่พร้อมขาย — ระบบอาจบังคับปิดหากไม่มีแพ็กหรือสต็อกรวมเป็น 0
              </p>
            </div>
            <Switch
              checked={form.is_active !== false}
              onCheckedChange={(v) => setField("is_active", v)}
              aria-label="เปิดขาย"
            />
          </div>
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">ชื่อสินค้า *</Label>
              <Input
                id="name"
                value={form.name ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setField("name", v);
                  if (!slugTouchedRef.current) {
                    const hasSlug = !!(form.slug ?? "").trim();
                    if (!isEditMode || !hasSlug) {
                      setField("slug", generateSlug(v));
                    }
                  }
                }}
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

            <div className="space-y-1 md:col-span-2">
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

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={form.slug ?? ""}
                onChange={(e) => {
                  slugTouchedRef.current = true;
                  setField("slug", e.target.value);
                }}
                placeholder="blue-dream-auto"
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-zinc-500">
                สร้างอัตโนมัติจากชื่อ — แก้ได้เมื่อต้องการ SEO; ใช้ a-z ตัวเลขและ - เท่านั้น
              </p>
              {getFieldError("slug") && (
                <p className="text-xs text-red-500">{getFieldError("slug")}</p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
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
          </div>

          {/* Description TH/EN */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="desc_th" className={isUnknown(form.description_th) ? "text-red-600" : ""}>
                คำบรรยาย (ภาษาไทย){isUnknown(form.description_th) && " ⚠"}
              </Label>
              <Textarea
                id="desc_th"
                value={form.description_th ?? ""}
                onChange={(e) => setField("description_th", e.target.value)}
                rows={5}
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
                rows={5}
                placeholder="Product description in English..."
                className={unknownCls(form.description_en)}
              />
            </div>
          </div>

          {/* Product Image Upload Zone — centered, max width on large modals */}
          <div className="mx-auto w-full max-w-2xl space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                📸 Product images / แกลเลอรีหน้าร้าน ({productSlots.length}/{MAX_IMAGES})
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
                        <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-primary/50 ring-1 ring-white" title="รูปใหม่ (จะ compress ก่อน upload)" />
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
              รูปแรก = หลัก · จุดเขียว = รอ compress &amp; upload — ใช้เฉพาะโชว์หน้าร้าน (สแกน AI ใช้โซน AI Scan ด้านบน)
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
              <Label className="text-xs">CBD</Label>
              <Input
                type="text"
                inputMode="text"
                value={form.cbd_percent ?? ""}
                onChange={(e) =>
                  setField("cbd_percent", e.target.value.trim() === "" ? null : e.target.value)
                }
                placeholder={'เช่น < 1% หรือ 5'}
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
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Flowering Type (ช่วงออกดอก)</Label>
              <select
                value={form.flowering_type ?? ""}
                onChange={(e) =>
                  setField(
                    "flowering_type",
                    (e.target.value || null) as "autoflower" | "photoperiod" | "photo_ff" | "photo_3n" | null
                  )
                }
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                <option value="autoflower">Auto</option>
                <option value="photoperiod">Photo</option>
                <option value="photo_ff">Photo FF</option>
                <option value="photo_3n">Photo 3N (Triploid)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sex Type (เพศเมล็ด)</Label>
              <select
                value={form.sex_type ?? ""}
                onChange={(e) =>
                  setSexTypeField(
                    (e.target.value || null) as "feminized" | "regular" | null
                  )
                }
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                <option value="feminized">Fem</option>
                <option value="regular">Reg</option>
              </select>
            </div>
          </div>

          {/* Yield & Difficulty */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

          {/* Extended Specs Row 2: Lineage + Sativa/Indica % */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            <div className="space-y-2">
              <Label className={`text-xs ${isUnknown(form.genetic_ratio) ? "text-red-600" : ""}`}>
                Genetic ratio (Sativa / Indica){isUnknown(form.genetic_ratio) && " ⚠"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="sativa_percent" className="text-[11px] text-zinc-500">
                    Sativa (%)
                  </Label>
                  <Input
                    id="sativa_percent"
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={form.sativa_percent ?? ""}
                    onChange={(e) => setSativaPercentInput(e.target.value)}
                    placeholder="70"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="indica_percent" className="text-[11px] text-zinc-500">
                    Indica (%)
                  </Label>
                  <Input
                    id="indica_percent"
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={form.indica_percent ?? ""}
                    onChange={(e) => setIndicaPercentInput(e.target.value)}
                    placeholder="30"
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">
                กรอกข้างใดข้างหนึ่ง — อีกข้างคำนวณให้รวม 100% · บันทึกเป็น genetic_ratio อัตโนมัติ
              </p>
            </div>
          </div>

          {/* Tag fields: Terpenes, Effects, Flavors, Medical */}
          <div key={formKey} className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              <Label className="text-sm font-semibold">
                แพ็กเกจ / Variants{" "}
                <span className="font-normal text-zinc-500">(ว่างได้ — บันทึกสเปกเป็นฉบับร่าง)</span>
              </Label>
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
              {variants.length === 0 && (
                <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                  ยังไม่มีแพ็กเกจ — บันทึกสเปก/คำบรรยายได้ (สินค้าจะไม่แสดงหน้าร้านจนมีแพ็กและสต็อกมากกว่า 0)
                </p>
              )}
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
                          ? "bg-accent text-primary"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {v.is_active ? "เปิด" : "ปิด"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="rounded p-1 text-red-400 hover:bg-red-50"
                      title="ลบแพ็ก"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
        </div>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:px-6">
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
