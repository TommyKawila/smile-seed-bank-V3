"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Loader2, Plus, Pencil, ToggleLeft, ToggleRight, Leaf, ImagePlus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Breeder } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreederForm {
  name: string;
  logo_url: string;
  description: string;
  description_en: string;
  summary_th: string;
  summary_en: string;
  highlight_origin_th: string;
  highlight_origin_en: string;
  highlight_specialty_th: string;
  highlight_specialty_en: string;
  highlight_reputation_th: string;
  highlight_reputation_en: string;
  highlight_focus_th: string;
  highlight_focus_en: string;
  is_active: boolean;
}

const emptyForm: BreederForm = {
  name: "",
  logo_url: "",
  description: "",
  description_en: "",
  summary_th: "",
  summary_en: "",
  highlight_origin_th: "",
  highlight_origin_en: "",
  highlight_specialty_th: "",
  highlight_specialty_en: "",
  highlight_reputation_th: "",
  highlight_reputation_en: "",
  highlight_focus_th: "",
  highlight_focus_en: "",
  is_active: true,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BreedersPage() {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Breeder | null>(null);
  const [form, setForm] = useState<BreederForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBreeders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/breeders");
      const data = await res.json();
      setBreeders(Array.isArray(data) ? data : []);
    } catch {
      setBreeders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBreeders(); }, [fetchBreeders]);

  // ── Open Modal ─────────────────────────────────────────────────────────────
  const resetLogoState = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    resetLogoState();
    setModalOpen(true);
  };

  const openEdit = (b: Breeder) => {
    setEditing(b);
    setForm({
      name: b.name,
      logo_url: b.logo_url ?? "",
      description: b.description ?? "",
      description_en: b.description_en ?? "",
      summary_th: b.summary_th ?? "",
      summary_en: b.summary_en ?? "",
      highlight_origin_th: b.highlight_origin_th ?? "",
      highlight_origin_en: b.highlight_origin_en ?? "",
      highlight_specialty_th: b.highlight_specialty_th ?? "",
      highlight_specialty_en: b.highlight_specialty_en ?? "",
      highlight_reputation_th: b.highlight_reputation_th ?? "",
      highlight_reputation_en: b.highlight_reputation_en ?? "",
      highlight_focus_th: b.highlight_focus_th ?? "",
      highlight_focus_en: b.highlight_focus_en ?? "",
      is_active: b.is_active,
    });
    setError(null);
    setLogoFile(null);
    setLogoPreviewUrl(b.logo_url ?? null);
    setModalOpen(true);
  };

  const handleLogoFile = async (file: File) => {
    setIsUploadingLogo(true);
    setError(null);
    try {
      // Compress before upload
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 400,
        fileType: "image/webp",
        useWebWorker: true,
      });
      const webpFile = new File([compressed], "logo.webp", { type: "image/webp" });
      setLogoFile(webpFile);
      setLogoPreviewUrl(URL.createObjectURL(webpFile));

      // Upload immediately so we have the URL ready for save
      const formData = new FormData();
      formData.append("file", webpFile);
      const res = await fetch("/api/admin/breeders/upload", { method: "POST", body: formData });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "อัปโหลดล้มเหลว");
      setForm((p) => ({ ...p, logo_url: json.url! }));
    } catch (err) {
      setError(`อัปโหลดโลโก้ล้มเหลว: ${String(err)}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("กรุณาระบุชื่อ Breeder"); return; }

    setIsSaving(true);
    setError(null);

    const payload = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      logo_url: form.logo_url.trim() || null,
      description: form.description.trim() || null,
      description_en: form.description_en.trim() || null,
      summary_th: form.summary_th.trim() || null,
      summary_en: form.summary_en.trim() || null,
      highlight_origin_th: form.highlight_origin_th.trim() || null,
      highlight_origin_en: form.highlight_origin_en.trim() || null,
      highlight_specialty_th: form.highlight_specialty_th.trim() || null,
      highlight_specialty_en: form.highlight_specialty_en.trim() || null,
      highlight_reputation_th: form.highlight_reputation_th.trim() || null,
      highlight_reputation_en: form.highlight_reputation_en.trim() || null,
      highlight_focus_th: form.highlight_focus_th.trim() || null,
      highlight_focus_en: form.highlight_focus_en.trim() || null,
      is_active: form.is_active,
    };

    try {
      const res = await fetch("/api/admin/breeders", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json?.error ?? "บันทึกไม่สำเร็จ"); return; }

      setModalOpen(false);
      await fetchBreeders();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Active ──────────────────────────────────────────────────────────
  const toggleActive = async (b: Breeder) => {
    await fetch("/api/admin/breeders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, is_active: !b.is_active }),
    });
    await fetchBreeders();
  };

  const filtered = breeders.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการ Breeders</h1>
          <p className="text-sm text-zinc-500">เพิ่ม/แก้ไขแบรนด์สินค้า ก่อนสร้างสินค้า</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white hover:bg-primary/90 shrink-0">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่ม Breeder
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="ค้นหา Breeder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
          <Leaf className="h-10 w-10 text-zinc-200" />
          <p className="text-sm font-medium text-zinc-500">
            {breeders.length === 0 ? "ยังไม่มี Breeder — กดปุ่ม 'เพิ่ม Breeder' เพื่อเริ่มต้น" : "ไม่พบ Breeder ที่ค้นหา"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 text-left">Breeder</th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">คำอธิบาย</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-zinc-50">
                  {/* Name + Logo */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                        {b.logo_url ? (
                          <Image
                            src={b.logo_url}
                            alt={b.name}
                            fill
                            className="object-contain p-1"
                            sizes="40px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Leaf className="h-4 w-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{b.name}</p>
                        {b.logo_url && (
                          <a
                            href={b.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[11px] text-zinc-400 hover:text-primary"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> ดูโลโก้
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="hidden max-w-xs px-4 py-3 sm:table-cell">
                    <p className="line-clamp-2 text-xs text-zinc-500">
                      {b.description ?? "—"}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(b)} className="inline-flex">
                      {b.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer">
                          <ToggleRight className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-400 cursor-pointer hover:bg-zinc-100">
                          <ToggleLeft className="mr-1 h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(b)}
                      className="h-8 gap-1.5 text-xs text-zinc-600 hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" /> แก้ไข
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-400">
            ทั้งหมด {filtered.length} Breeder
            {breeders.filter((b) => b.is_active).length > 0 && (
              <span className="ml-2 text-emerald-600">
                · Active {breeders.filter((b) => b.is_active).length} ราย
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); resetLogoState(); } }}>
        <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">

          {/* ── Sticky Header ─────────────────────────────────────────────── */}
          <DialogHeader className="shrink-0 border-b border-zinc-100 px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-5 w-5 text-primary" />
              {editing ? `แก้ไข: ${editing.name}` : "เพิ่ม Breeder ใหม่"}
            </DialogTitle>
          </DialogHeader>

          {/* ── Scrollable Body ───────────────────────────────────────────── */}
          <form id="breeder-form" onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* Top strip: Name + Logo (full width) */}
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1">
                  <Label htmlFor="b-name">ชื่อ Breeder *</Label>
                  <Input
                    id="b-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="เช่น Barney's Farm, FastBuds"
                    autoFocus
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-1">
                  <Label>โลโก้ Breeder</Label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogoFile(f); }}
                  />
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-primary"
                    >
                      {logoPreviewUrl ? (
                        <Image src={logoPreviewUrl} alt="logo preview" fill className="object-contain p-1.5" unoptimized />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-0.5 text-zinc-300">
                          <ImagePlus className="h-5 w-5" />
                          <span className="text-[8px] font-medium">คลิก</span>
                        </div>
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        <ImagePlus className="h-3 w-3" />
                        {logoPreviewUrl ? "เปลี่ยน" : "อัปโหลด"}
                      </button>
                      {logoPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => { setLogoPreviewUrl(null); setLogoFile(null); setForm((p) => ({ ...p, logo_url: "" })); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1 text-xs text-red-400 hover:border-red-300 hover:text-red-600"
                        >
                          <X className="h-3 w-3" /> ลบ
                        </button>
                      )}
                      <p className="w-full text-[10px] text-zinc-400">WebP · max 400px</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Two-column content ─────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">

                {/* ── LEFT: Thai Content ─────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
                    <span className="text-base">🇹🇭</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">Thai Content</span>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="b-desc">คำอธิบาย (ภาษาไทย)</Label>
                    <Textarea
                      id="b-desc"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="ข้อมูลเกี่ยวกับ Breeder ภาษาไทย..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="b-sum-th">
                      Summary (ไทย)
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-400">max 300 chars — สำหรับ Shop Banner</span>
                    </Label>
                    <Textarea
                      id="b-sum-th"
                      value={form.summary_th}
                      onChange={(e) => setForm((p) => ({ ...p, summary_th: e.target.value.slice(0, 300) }))}
                      placeholder="สรุปสั้นๆ สำหรับแสดงหน้าร้าน..."
                      rows={2}
                    />
                    <p className="text-right text-[10px] text-zinc-400">{form.summary_th.length}/300</p>
                  </div>

                  <div className="rounded-xl bg-primary/5 px-3 py-1.5 text-[10px] font-semibold text-primary">
                    🏆 Key Highlights (TH)
                  </div>
                  {(
                    [
                      { label: "แหล่งกำเนิด", key: "highlight_origin_th" as const, ph: "เช่น บาร์เซโลน่า สเปน" },
                      { label: "ความเชี่ยวชาญ", key: "highlight_specialty_th" as const, ph: "เช่น Autoflower, Feminized" },
                      { label: "ชื่อเสียง", key: "highlight_reputation_th" as const, ph: "เช่น Cannabis Cup Winner" },
                      { label: "จุดเด่น", key: "highlight_focus_th" as const, ph: "เช่น High-THC, Medical" },
                    ]
                  ).map(({ label, key, ph }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs font-medium text-zinc-500">{label}</p>
                      <Input
                        value={form[key]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={ph}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>

                {/* ── RIGHT: English Content ─────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
                    <span className="text-base">🇺🇸</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">English Content</span>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="b-desc-en">
                      Description (English)
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-400">optional</span>
                    </Label>
                    <Textarea
                      id="b-desc-en"
                      value={form.description_en}
                      onChange={(e) => setForm((p) => ({ ...p, description_en: e.target.value }))}
                      placeholder="Short breeder story in English..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="b-sum-en">
                      Summary (English)
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-400">max 300 chars — for Shop Banner</span>
                    </Label>
                    <Textarea
                      id="b-sum-en"
                      value={form.summary_en}
                      onChange={(e) => setForm((p) => ({ ...p, summary_en: e.target.value.slice(0, 300) }))}
                      placeholder="Short banner summary in English..."
                      rows={2}
                    />
                    <p className="text-right text-[10px] text-zinc-400">{form.summary_en.length}/300</p>
                  </div>

                  <div className="rounded-xl bg-primary/5 px-3 py-1.5 text-[10px] font-semibold text-primary">
                    🏆 Key Highlights (EN)
                  </div>
                  {(
                    [
                      { label: "Origin", key: "highlight_origin_en" as const, ph: "e.g. Barcelona, Spain" },
                      { label: "Specialty", key: "highlight_specialty_en" as const, ph: "e.g. Autoflower, Feminized" },
                      { label: "Reputation", key: "highlight_reputation_en" as const, ph: "e.g. Cannabis Cup Winner" },
                      { label: "Focus", key: "highlight_focus_en" as const, ph: "e.g. High-THC, Medical" },
                    ]
                  ).map(({ label, key, ph }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs font-medium text-zinc-500">{label}</p>
                      <Input
                        value={form[key]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={ph}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Toggle (full width) */}
              <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-700">สถานะ Active</p>
                  <p className="text-xs text-zinc-400">Breeder ที่ Active จะปรากฏใน dropdown สินค้า</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? "bg-primary" : "bg-zinc-300"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {/* ── Sticky Footer ─────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4">
              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  ⚠️ {error}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isSaving ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> กำลังบันทึก...</>
                  ) : editing ? "บันทึกการแก้ไข" : "เพิ่ม Breeder"}
                </Button>
              </div>
            </div>
          </form>

        </DialogContent>
      </Dialog>
    </div>
  );
}
