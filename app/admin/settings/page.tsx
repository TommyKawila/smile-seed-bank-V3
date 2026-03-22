"use client";

import { useRef, useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Upload, Trash2, ImageIcon, Code2, Image as ImageLucide, CreditCard, ChevronRight, MessageCircle, CheckCircle2, XCircle, Plus, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings, type SocialLink } from "@/hooks/useSiteSettings";
import { formatPhoneNumber } from "@/lib/utils";

function LogoUploadCard({
  title,
  description,
  settingKey,
  accept,
  currentUrl,
  onSaved,
  onClear,
}: {
  title: string | React.ReactNode;
  description: string;
  settingKey: string;
  accept: string;
  currentUrl?: string;
  onSaved: (key: string, url: string) => Promise<void>;
  onClear?: (key: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", settingKey);

      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json() as { url?: string; error?: string };

      if (!res.ok || !json.url) throw new Error(json.error ?? "อัปโหลดล้มเหลว");

      setPreview(`${json.url}?t=${Date.now()}`); // cache-bust preview
      await onSaved(settingKey, json.url);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-zinc-500">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div
          className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 cursor-pointer hover:border-primary/60 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <Image
              src={preview}
              alt={title}
              fill
              className="object-contain p-4"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span className="text-xs font-medium">คลิกเพื่ออัปโหลด</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {preview ? "เปลี่ยนไฟล์" : "อัปโหลด"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={async () => {
                setPreview(null);
                await onClear?.(settingKey);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {preview && (
          <p className="break-all text-[10px] text-zinc-400 leading-relaxed">
            {preview.split("?")[0]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { settings, isLoading, updateSetting } = useSiteSettings();
  const [saved, setSaved] = useState(false);
  const [heroMode, setHeroMode] = useState<"static_image" | "animated_svg">("static_image");
  const [heroSvg, setHeroSvg] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [lineStatus, setLineStatus] = useState<{ configured: boolean; hasToken: boolean; hasAdminUserId: boolean } | null>(null);
  const [lineTestLoading, setLineTestLoading] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/admin/line-alert/status")
      .then((r) => r.json())
      .then(setLineStatus)
      .catch(() => setLineStatus(null));
  }, []);

  // Sync hero state when settings load
  useEffect(() => {
    if (!isLoading) {
      setHeroMode(settings.hero_bg_mode ?? "static_image");
      setHeroSvg(settings.hero_svg_code ?? "");
    }
  }, [isLoading, settings.hero_bg_mode, settings.hero_svg_code]);

  const handleSaved = async (key: string, url: string) => {
    await updateSetting(key, url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = async (key: string) => {
    await updateSetting(key, "");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    try {
      await updateSetting("hero_bg_mode", heroMode);
      await updateSetting("hero_svg_code", heroSvg.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSavingHero(false);
    }
  };

  const svgTrimmed = heroSvg.trim();
  const svgIsValid = svgTrimmed.toLowerCase().startsWith("<svg");
  const showSvgWarning = svgTrimmed.length > 0 && !svgIsValid;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Brand Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">จัดการโลโก้และ Hero Background ที่ใช้ทั่วทั้งเว็บไซต์</p>
      </div>

      {saved && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          ✅ บันทึกเรียบร้อยแล้ว
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl">
          <LogoUploadCard
            title="Main Logo (Primary SVG Format)"
            description="ใช้สำหรับ Header, Footer และ Email — ควรเป็น SVG หรือ PNG พื้นหลังใส"
            settingKey="logo_main_url"
            accept="image/svg+xml,image/png"
            currentUrl={settings.logo_main_url}
            onSaved={handleSaved}
            onClear={handleClear}
          />
          <LogoUploadCard
            title="Main Logo (Secondary PNG Format)"
            description="ใช้สำหรับเอกสาร PDF และแอปพลิเคชันที่ไม่รองรับ SVG"
            settingKey="logo_secondary_png_url"
            accept="image/png"
            currentUrl={settings.logo_secondary_png_url}
            onSaved={handleSaved}
            onClear={handleClear}
          />
        </div>
      )}

      <Separator />

      {/* ── Company & Legal Information ───────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company & Legal Information
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          ข้อมูลบริษัทและเอกสารทางกฎหมายสำหรับเอกสาร PDF
        </p>
      </div>

      {!isLoading && (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ข้อมูลบริษัท</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Company Name</Label>
                  <Input
                    value={settings.company_name ?? ""}
                    onChange={(e) => updateSetting("company_name", e.target.value)}
                    onBlur={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                    placeholder="Smile Seed Bank"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    value={settings.company_email ?? ""}
                    onChange={(e) => updateSetting("company_email", e.target.value)}
                    onBlur={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                    placeholder="contact@example.com"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Address</Label>
                <Input
                  value={settings.company_address ?? ""}
                  onChange={(e) => updateSetting("company_address", e.target.value)}
                  onBlur={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                  placeholder="ที่อยู่บริษัท"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Phone</Label>
                <Input
                  value={settings.company_phone ?? ""}
                  onChange={(e) => updateSetting("company_phone", e.target.value)}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v) updateSetting("company_phone", formatPhoneNumber(v));
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2500);
                  }}
                  placeholder="081-234-5678"
                  className="h-9"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-sm">Social Media</Label>
                <p className="text-xs text-zinc-500">Platform และ Handle/URL</p>
                {(settings.social_media ? (() => { try { return JSON.parse(settings.social_media) as SocialLink[]; } catch { return []; } })() : []).map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => {
                        const arr = (() => { try { return JSON.parse(settings.social_media || "[]") as SocialLink[]; } catch { return []; } })();
                        arr[i] = { ...arr[i], platform: e.target.value };
                        updateSetting("social_media", JSON.stringify(arr));
                      }}
                      className="h-9 w-28 rounded border border-zinc-200 bg-white text-sm"
                    >
                      <option value="Line">Line</option>
                      <option value="X">X</option>
                      <option value="IG">IG</option>
                      <option value="Youtube">Youtube</option>
                      <option value="Telegram">Telegram</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Facebook">Facebook</option>
                    </select>
                    <Input
                      value={link.handle}
                      onChange={(e) => {
                        const arr = (() => { try { return JSON.parse(settings.social_media || "[]") as SocialLink[]; } catch { return []; } })();
                        arr[i] = { ...arr[i], handle: e.target.value };
                        updateSetting("social_media", JSON.stringify(arr));
                      }}
                      placeholder="@handle หรือ URL"
                      className="h-9 flex-1"
                    />
                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => {
                      const arr = (() => { try { return JSON.parse(settings.social_media || "[]") as SocialLink[]; } catch { return []; } })();
                      arr.splice(i, 1);
                      updateSetting("social_media", JSON.stringify(arr));
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const arr = (() => { try { return JSON.parse(settings.social_media || "[]") as SocialLink[]; } catch { return []; } })();
                    arr.push({ platform: "Line", handle: "" });
                    updateSetting("social_media", JSON.stringify(arr));
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <LogoUploadCard
              title="ใบอนุญาตจำหน่ายเมล็ดพันธุ์ควบคุม"
              description="Seed License (PDF/Image)"
              settingKey="legal_seed_license_url"
              accept="image/*,application/pdf"
              currentUrl={settings.legal_seed_license_url}
              onSaved={handleSaved}
              onClear={handleClear}
            />
            <LogoUploadCard
              title="ทะเบียนพาณิชย์/หนังสือรับรองบริษัท"
              description="Business Registration (PDF/Image)"
              settingKey="legal_business_registration_url"
              accept="image/*,application/pdf"
              currentUrl={settings.legal_business_registration_url}
              onSaved={handleSaved}
              onClear={handleClear}
            />
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">เลขที่ใบอนุญาต (แสดงใน PDF)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">เลขที่ใบอนุญาตเมล็ดพันธุ์</Label>
                  <Input
                    value={settings.legal_seed_license_number ?? ""}
                    onChange={(e) => updateSetting("legal_seed_license_number", e.target.value)}
                    onBlur={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                    placeholder="เลขที่"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">เลขทะเบียนพาณิชย์</Label>
                  <Input
                    value={settings.legal_business_registration_number ?? ""}
                    onChange={(e) => updateSetting("legal_business_registration_number", e.target.value)}
                    onBlur={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                    placeholder="เลขที่"
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* ── LINE Alert Settings ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#06C755]" />
          LINE Alerts (แจ้งเตือน)
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          แจ้งเตือน Low Stock, Void Order, Daily Summary ไปยัง LINE ของ Admin
        </p>
        <Card className="mt-3 max-w-xl">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">สถานะการเชื่อมต่อ</span>
              {lineStatus ? (
                lineStatus.configured ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    ตั้งค่าแล้ว
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-amber-600">
                    <XCircle className="h-4 w-4" />
                    {!lineStatus.hasToken && "LINE_CHANNEL_ACCESS_TOKEN "}
                    {!lineStatus.hasAdminUserId && "LINE_ADMIN_USER_ID "}
                    ยังไม่ได้ตั้งค่า
                  </span>
                )
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setLineTestLoading(true);
                setLineTestResult(null);
                try {
                  const res = await fetch("/api/admin/line-alert/test", { method: "POST" });
                  const j = await res.json();
                  setLineTestResult(res.ok ? "success" : "error");
                  if (!res.ok) alert(j.error ?? "ส่งไม่สำเร็จ");
                } catch {
                  setLineTestResult("error");
                  alert("เกิดข้อผิดพลาด");
                } finally {
                  setLineTestLoading(false);
                }
              }}
              disabled={!lineStatus?.configured || lineTestLoading}>
              {lineTestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ทดสอบส่งข้อความ"}
            </Button>
            {lineTestResult === "success" && (
              <p className="text-sm text-emerald-600">✓ ส่งข้อความทดสอบสำเร็จ — ตรวจสอบ LINE ได้เลย</p>
            )}
            {lineTestResult === "error" && (
              <p className="text-sm text-red-600">ส่งไม่สำเร็จ — ตรวจสอบ Token และ User ID ใน .env.local</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ── Payment Settings Link ─────────────────────────────────────────────── */}
      <Link
        href="/admin/settings/payment"
        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">ช่องทางการชำระเงิน</p>
            <p className="text-xs text-zinc-500">บัญชีธนาคาร, PromptPay, Crypto, Line, Messenger</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </Link>

      <Separator />

      {/* ── Hero Background — Two-Column Live Editor ─────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800">Hero Background</h2>
        <p className="mt-0.5 text-sm text-zinc-500">เลือกพื้นหลัง Hero Section และดู Preview แบบ Real-time</p>
      </div>

      {!isLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Mode Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Background Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHeroMode("static_image")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      heroMode === "static_image"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                    }`}
                  >
                    <ImageLucide className="h-4 w-4" />
                    Static Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroMode("animated_svg")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      heroMode === "animated_svg"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    Animated SVG
                  </button>
                </div>
              </div>

              {/* SVG Textarea */}
              {heroMode === "animated_svg" && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">SVG Code</Label>
                  <Textarea
                    rows={14}
                    spellCheck={false}
                    placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900">\n  <style>/* your CSS animations */</style>\n  <!-- shapes & paths -->\n</svg>`}
                    value={heroSvg}
                    onChange={(e) => setHeroSvg(e.target.value)}
                    className="font-mono text-xs leading-relaxed resize-none"
                  />
                  {showSvgWarning && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                      ⚠️ โค้ดต้องเริ่มต้นด้วย &lt;svg — กรุณาวาง SVG ที่ถูกต้อง
                    </p>
                  )}
                  {!showSvgWarning && svgTrimmed && (
                    <p className="text-[11px] text-zinc-400">
                      รองรับ SMIL Animation และ CSS Keyframes ใน &lt;style&gt; tag
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={() => void handleSaveHero()}
                disabled={savingHero || (heroMode === "animated_svg" && showSvgWarning)}
                className="w-full gap-2"
              >
                {savingHero && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingHero ? "กำลังบันทึก..." : "💾 บันทึก Hero Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* ── RIGHT: Live Preview ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-700">Live Preview</p>
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg" style={{ aspectRatio: "16/9" }}>
              {/* SVG background */}
              {heroMode === "animated_svg" && svgIsValid ? (
                <div
                  className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: heroSvg }}
                />
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=800&q=70')" }}
                />
              )}
              {/* Gradient overlay — same as live site */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-900/80" />
              {/* Sample hero content */}
              <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Premium Cannabis Seeds
                </span>
                <p className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  เมล็ดพันธุ์คุณภาพ<br />
                  <span className="text-primary">คัดสรรเพื่อคุณ</span>
                </p>
                <p className="max-w-xs text-[11px] leading-relaxed text-zinc-300">
                  แหล่งรวมสายพันธุ์พรีเมียมจาก Breeder ชั้นนำทั่วโลก
                </p>
                <div className="mt-1 h-7 w-24 rounded-full bg-primary/80 text-[10px] font-semibold text-white flex items-center justify-center">
                  Shop Now →
                </div>
              </div>
              {/* Mode badge */}
              <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {heroMode === "animated_svg" && svgIsValid ? "✦ Animated SVG" : "📷 Static Image"}
              </span>
            </div>
            {heroMode === "animated_svg" && !svgTrimmed && (
              <p className="text-xs text-zinc-400">วาง SVG code ทางซ้ายเพื่อดู Preview</p>
            )}
          </div>
        </div>
      )}

      <Separator />

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">📋 SQL Setup (Supabase — run once)</p>
        <pre className="mt-2 overflow-x-auto rounded bg-amber-100 p-3 text-[11px] leading-relaxed text-amber-900">
{`-- 1. Create brand-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Allow public read, service-role write
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "admin write" ON site_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Keys: logo_main_url, logo_secondary_png_url, company_name, company_address, company_email, company_phone,
--       social_media (JSON), legal_seed_license_url, legal_seed_license_number,
--       legal_business_registration_url, legal_business_registration_number, hero_bg_mode, hero_svg_code`}
        </pre>
      </div>
    </div>
  );
}
