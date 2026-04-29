"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, CreditCard, ChevronRight, MessageCircle, CheckCircle2, XCircle, Plus, Building2, Truck, Trash2, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings, type SocialLink } from "@/hooks/useSiteSettings";
import { formatPhoneNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";
import { LogoUploadCard } from "@/components/admin/settings/LogoUploadCard";

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, isLoading, updateSetting } = useSiteSettings();
  const [saved, setSaved] = useState(false);
  const [lineStatus, setLineStatus] = useState<{ configured: boolean; hasToken: boolean; hasAdminUserId: boolean } | null>(null);
  const [lineTestLoading, setLineTestLoading] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/admin/line-alert/status")
      .then((r) => r.json())
      .then(setLineStatus)
      .catch(() => setLineStatus(null));
  }, []);

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

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Brand Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">จัดการโลโก้และ Hero Background ที่ใช้ทั่วทั้งเว็บไซต์</p>
      </div>

      {saved && (
        <div className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-primary">
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
                  <span className="flex items-center gap-1.5 text-sm text-primary">
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
                  if (!res.ok) {
                    toast({
                      title: "เกิดข้อผิดพลาด (Error)",
                      description: j.error ?? "ส่งไม่สำเร็จ",
                      variant: "destructive",
                    });
                  }
                } catch (e) {
                  setLineTestResult("error");
                  console.error(e);
                  toast({
                    title: "เกิดข้อผิดพลาด (Error)",
                    description: toastErrorMessage(e),
                    variant: "destructive",
                  });
                } finally {
                  setLineTestLoading(false);
                }
              }}
              disabled={!lineStatus?.configured || lineTestLoading}>
              {lineTestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ทดสอบส่งข้อความ"}
            </Button>
            {lineTestResult === "success" && (
              <p className="text-sm text-primary">✓ ส่งข้อความทดสอบสำเร็จ — ตรวจสอบ LINE ได้เลย</p>
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
        href="/admin/settings/shipping"
        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">ค่าจัดส่ง</p>
            <p className="text-xs text-zinc-500">ค่าส่งมาตรฐานและยอดส่งฟรี (หมวด Seeds)</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </Link>

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
            <p className="text-xs text-zinc-500">บัญชีธนาคาร, PromptPay, Line, Messenger</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </Link>

      <Separator />

      <Link
        href="/admin/settings/hero"
        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Hero Background</p>
            <p className="text-xs text-zinc-500">
              Static image / Animated SVG — โหมดบันทึกทันทีเมื่อสลับแท็บ
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </Link>

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

-- 3. RLS: public SELECT only storefront-safe keys; writes via service_role (see supabase/migrations/20260331120000_site_store_settings_public_select_rls.sql)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
-- Policy names: site_settings_select_public_safe_keys, store_settings_select_public

-- Keys: logo_main_url, logo_secondary_png_url, company_name, company_address, company_email, company_phone,
--       social_media (JSON), legal_seed_license_url, legal_seed_license_number,
--       legal_business_registration_url, legal_business_registration_number, hero_bg_mode, hero_svg_code`}
        </pre>
      </div>
    </div>
  );
}
