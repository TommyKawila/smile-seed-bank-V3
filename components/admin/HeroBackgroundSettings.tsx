"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, Image as ImageLucide, Code2, Trash2, Upload, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import { isHeroSvgMarkup, normalizeHeroSvgHtml } from "@/lib/hero-svg";

const STATIC_FALLBACK =
  "https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=800&q=70";

const HERO_STATIC_KEY = "hero_static_image_url";
const HERO_VIDEO_KEY = "hero_video_url";
const UPLOAD_BUCKET = "site-assets";

type HeroBgMode = "static_image" | "video" | "animated_svg";

export function HeroBackgroundSettings() {
  const { toast } = useToast();
  const { settings, isLoading, updateSetting } = useSiteSettings();
  const [heroSvg, setHeroSvg] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [uploadingStatic, setUploadingStatic] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const staticInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const heroMode = (settings.hero_bg_mode ?? "static_image") as HeroBgMode;
  const staticPreview = settings.hero_static_image_url?.trim() || null;
  const videoPreview = settings.hero_video_url?.trim() || null;

  useEffect(() => {
    if (!isLoading) {
      setHeroSvg(settings.hero_svg_code ?? "");
    }
  }, [isLoading, settings.hero_svg_code]);

  const handleSaveSvg = async () => {
    setSavingHero(true);
    try {
      await updateSetting("hero_svg_code", heroSvg.trim());
    } catch (e) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setSavingHero(false);
    }
  };

  const handleStaticFile = async (file: File) => {
    setUploadingStatic(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", HERO_STATIC_KEY);
      formData.append("bucket", UPLOAD_BUCKET);
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "อัปโหลดล้มเหลว");
      await updateSetting(HERO_STATIC_KEY, json.url);
    } catch (e) {
      toast({
        title: "อัปโหลด / บันทึกไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setUploadingStatic(false);
    }
  };

  const handleVideoFile = async (file: File) => {
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", HERO_VIDEO_KEY);
      formData.append("bucket", UPLOAD_BUCKET);
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "อัปโหลดวิดีโอล้มเหลว");
      await updateSetting(HERO_VIDEO_KEY, json.url);
    } catch (e) {
      toast({
        title: "อัปโหลดวิดีโอไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const clearStatic = async () => {
    try {
      await updateSetting(HERO_STATIC_KEY, "");
    } catch (e) {
      toast({
        title: "ล้างรูปไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    }
  };

  const clearVideo = async () => {
    try {
      await updateSetting(HERO_VIDEO_KEY, "");
    } catch (e) {
      toast({
        title: "ล้างวิดีโอไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    }
  };

  const svgTrimmed = heroSvg.trim();
  const svgNormalized = normalizeHeroSvgHtml(heroSvg);
  const svgIsValid = isHeroSvgMarkup(heroSvg);
  const showSvgWarning = svgTrimmed.length > 0 && !svgIsValid;

  const persistMode = async (mode: HeroBgMode) => {
    try {
      await updateSetting("hero_bg_mode", mode);
    } catch (e) {
      toast({
        title: "บันทึกโหมดไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const previewStaticUrl = staticPreview ?? STATIC_FALLBACK;

  const previewVideoSrc = videoPreview;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Background mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs
            value={heroMode}
            onValueChange={(v) => {
              void persistMode(v as HeroBgMode);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 gap-1">
              <TabsTrigger value="static_image" className="gap-1 px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
                <ImageLucide className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">Static</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-1 px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
                <Video className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">Video</span>
              </TabsTrigger>
              <TabsTrigger value="animated_svg" className="gap-1 px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
                <Code2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">SVG</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="static_image" className="mt-4 space-y-4">
              <p className="text-xs text-zinc-500">
                อัปโหลดรูปพื้นหลัง (เก็บใน bucket <code className="rounded bg-zinc-100 px-1">site-assets</code>) — ถ้าไม่มีรูปจะใช้ภาพสต็อกเริ่มต้น
              </p>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hero background image</Label>
                <div
                  className="relative flex min-h-[140px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-primary/50"
                  onClick={() => staticInputRef.current?.click()}
                >
                  {staticPreview ? (
                    <Image
                      src={staticPreview}
                      alt="Hero static background"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-zinc-400">
                      <Upload className="h-8 w-8 opacity-50" />
                      <span className="text-xs font-medium">คลิกเพื่ออัปโหลด (JPG / PNG / WebP)</span>
                    </div>
                  )}
                  {uploadingStatic && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <input
                  ref={staticInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleStaticFile(f);
                    e.target.value = "";
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={uploadingStatic}
                    onClick={() => staticInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    {staticPreview ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                  </Button>
                  {staticPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void clearStatic()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="video" className="mt-4 space-y-4">
              <p className="text-xs text-zinc-500">
                Cinemagraph / loop video (MP4 / WebM) — อัปโหลดตรงไปยัง Storage โดยไม่ผ่านการบีบอัดรูป
              </p>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hero background video</Label>
                <div
                  className="relative flex min-h-[140px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-primary/50"
                  onClick={() => videoInputRef.current?.click()}
                >
                  {previewVideoSrc ? (
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      src={previewVideoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-zinc-400">
                      <Video className="h-8 w-8 opacity-50" />
                      <span className="text-xs font-medium">คลิกเพื่ออัปโหลด (MP4 / WebM)</span>
                    </div>
                  )}
                  {uploadingVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,.mp4,.webm"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleVideoFile(f);
                    e.target.value = "";
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={uploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    {previewVideoSrc ? "เปลี่ยนวิดีโอ" : "อัปโหลดวิดีโอ"}
                  </Button>
                  {previewVideoSrc && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void clearVideo()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="animated_svg" className="mt-4 space-y-2">
              <Label className="text-sm font-semibold">SVG Code</Label>
              <Textarea
                rows={14}
                spellCheck={false}
                placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900">\n  <style>/* animations */</style>\n</svg>`}
                value={heroSvg}
                onChange={(e) => setHeroSvg(e.target.value)}
                className="resize-none font-mono text-xs leading-relaxed"
              />
              {showSvgWarning && (
                <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  ⚠️ ต้องมีแท็ก &lt;svg — หรือนำหน้าด้วย &lt;?xml ได้ (ระบบจะตัดส่วนนำออก)
                </p>
              )}
              {!showSvgWarning && svgTrimmed && (
                <p className="text-[11px] text-zinc-400">
                  รองรับ SMIL / CSS ใน &lt;style&gt;
                </p>
              )}
            </TabsContent>
          </Tabs>

          {heroMode === "animated_svg" && (
            <Button
              type="button"
              onClick={() => void handleSaveSvg()}
              disabled={savingHero || showSvgWarning}
              className="w-full gap-2"
            >
              {savingHero && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingHero ? "กำลังบันทึก..." : "💾 บันทึก SVG"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-700">Live Preview</p>
        <div
          className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg"
          style={{ aspectRatio: "16/9" }}
        >
          {heroMode === "animated_svg" && svgIsValid ? (
            <div
              className="absolute inset-0 z-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:min-h-full [&>svg]:pointer-events-none"
              dangerouslySetInnerHTML={{ __html: svgNormalized }}
            />
          ) : heroMode === "video" && previewVideoSrc ? (
            <video
              className="absolute inset-0 z-0 h-full w-full object-cover opacity-40"
              src={previewVideoSrc}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url('${previewStaticUrl}')` }}
            />
          )}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-900/80" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Premium Cannabis Seeds
            </span>
            <p className="flex flex-col gap-4 text-xl font-extrabold leading-snug text-white sm:text-2xl">
              <span>เมล็ดพันธุ์คุณภาพ</span>
              <span className="text-primary">คัดสรรเพื่อคุณ</span>
            </p>
            <p className="max-w-xs text-[11px] leading-relaxed text-zinc-300">
              แหล่งรวมสายพันธุ์พรีเมียมจาก Breeder ชั้นนำทั่วโลก
            </p>
            <div className="mt-1 flex h-7 w-24 items-center justify-center rounded-full bg-primary/80 text-[10px] font-semibold text-white">
              Shop Now →
            </div>
          </div>
          <span className="absolute right-2 top-2 z-20 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {heroMode === "animated_svg" && svgIsValid
              ? "✦ Animated SVG"
              : heroMode === "video"
                ? "🎬 Cinemagraph"
                : "📷 Static Image"}
          </span>
        </div>
        {heroMode === "animated_svg" && !svgTrimmed && (
          <p className="text-xs text-zinc-400">วาง SVG ทางซ้ายเพื่อดู Preview</p>
        )}
        {heroMode === "video" && !previewVideoSrc && (
          <p className="text-xs text-zinc-400">อัปโหลดวิดีโอทางซ้ายเพื่อดู Preview</p>
        )}
      </div>
    </div>
  );
}
