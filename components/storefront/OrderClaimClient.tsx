"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const orderMono = JetBrains_Mono({ subsets: ["latin"] });

type Preview = {
  order_number: string;
  total_amount: number;
  status: string;
};

export function OrderClaimClient({ token }: { token: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipping_name, setName] = useState("");
  const [shipping_address, setAddress] = useState("");
  const [shipping_phone, setPhone] = useState("");
  const [shipping_email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [claimInfo, setClaimInfo] = useState<{
    welcomeBack: boolean;
    newAccount: boolean;
    displayName: string;
    showSetPassword: boolean;
    linked: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/storefront/orders/claim/${encodeURIComponent(token)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError((data as { error?: string }).error ?? "ไม่พบออเดอร์");
        setPreview(null);
        return;
      }
      setPreview(data as Preview);
    } catch {
      setLoadError("โหลดไม่สำเร็จ");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setSubmitError("กรุณาแนบสลิปโอนเงิน");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      fd.set("shipping_name", shipping_name.trim());
      fd.set("shipping_address", shipping_address.trim());
      fd.set("shipping_phone", shipping_phone.trim());
      if (shipping_email.trim()) fd.set("shipping_email", shipping_email.trim());
      fd.set("file", file);
      const res = await fetch(`/api/storefront/orders/claim/${encodeURIComponent(token)}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError((data as { error?: string }).error ?? "ส่งไม่สำเร็จ");
        return;
      }
      const c = (data as { claim?: { linked?: boolean; isExisting?: boolean; displayName?: string; showSetPasswordHint?: boolean } }).claim;
      const linked = !!c?.linked;
      const isExisting = !!c?.isExisting;
      setClaimInfo({
        linked,
        welcomeBack: linked && isExisting,
        newAccount: linked && !isExisting,
        displayName: c?.displayName?.trim() || shipping_name.trim(),
        showSetPassword: !!c?.showSetPasswordHint,
      });
      setDone(true);
    } catch {
      setSubmitError("ส่งไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-800/70" />
        <p className="text-sm">กำลังโหลด…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-zinc-600">{loadError}</p>
      </div>
    );
  }

  if (preview && preview.status !== "PENDING_INFO") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm">
        <p className={cn("mb-2 text-lg font-medium text-zinc-800", orderMono.className)}>
          #{preview.order_number}
        </p>
        <p className="text-sm text-zinc-600">Order already processed</p>
        <p className="mt-1 text-xs text-zinc-400">ออเดอร์นี้ดำเนินการแล้ว</p>
      </div>
    );
  }

  if (done) {
    const name = claimInfo?.displayName ?? "";
    const headline =
      claimInfo?.welcomeBack
        ? `Welcome back, ${name}`
        : claimInfo?.newAccount
          ? `Welcome, ${name}`
          : "ส่งข้อมูลเรียบร้อย";
    const subTh =
      claimInfo?.linked
        ? "เชื่อมบัญชีร้านค้าแล้ว — อัปเดตที่อยู่ในโปรไฟล์เรียบร้อย"
        : "เราได้รับที่อยู่และสลิปแล้ว — ทีมจะตรวจสอบและดำเนินการต่อไป";
    const loginEmail = shipping_email.trim();
    return (
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-8 text-center shadow-sm">
        <div>
          <p className="text-base font-medium text-emerald-900">{headline}</p>
          <p className="mt-2 text-sm text-emerald-800/90">{subTh}</p>
        </div>
        <Button
          asChild
          className="h-12 w-full bg-emerald-800 text-white hover:bg-emerald-800/90"
        >
          <Link href={`/order/status/${encodeURIComponent(token)}`}>
            Check Order Status
          </Link>
        </Button>
        {claimInfo?.showSetPassword && loginEmail ? (
          <Button asChild variant="outline" className="h-11 w-full border-emerald-800/30 text-emerald-900">
            <Link href={`/login?email=${encodeURIComponent(loginEmail)}`}>
              ตั้งรหัสผ่าน (ไม่บังคับ)
            </Link>
          </Button>
        ) : null}
        <p className="text-xs text-emerald-900/70">
          บันทึกลิงก์สถานะออเดอร์เพื่อดูเลขพัสดุเมื่อจัดส่งแล้ว
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-1">
      <header className="mb-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-400">
          Genetic Vault
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">
          ยืนยันการสั่งซื้อ
        </h1>
        {preview && (
          <p className={cn("mt-3 text-sm text-emerald-900/90", orderMono.className)}>
            #{preview.order_number}
            <span className="ml-2 text-zinc-500">
              · ฿{preview.total_amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
            </span>
          </p>
        )}
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-7"
      >
        <div className="space-y-2">
          <Label htmlFor="shipping_name" className="text-zinc-700">
            ชื่อ-นามสกุล (ผู้รับ)
          </Label>
          <Input
            id="shipping_name"
            value={shipping_name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="border-zinc-200"
            placeholder="ชื่อจริงตามพัสดุ"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shipping_address" className="text-zinc-700">
            ที่อยู่จัดส่ง
          </Label>
          <Textarea
            id="shipping_address"
            value={shipping_address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={4}
            className="resize-y border-zinc-200 text-base"
            placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shipping_phone" className="text-zinc-700">
            เบอร์โทร
          </Label>
          <Input
            id="shipping_phone"
            type="tel"
            inputMode="numeric"
            value={shipping_phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            className="border-zinc-200"
            placeholder="08xxxxxxxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shipping_email" className="text-zinc-700">
            อีเมล (แนะนำ — แจ้งเตือนและเชื่อมบัญชีร้านโดยไม่ต้องล็อกอิน)
          </Label>
          <Input
            id="shipping_email"
            type="email"
            inputMode="email"
            value={shipping_email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="border-zinc-200"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-700">สลิปโอนเงิน</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-800/25 bg-zinc-50/80 px-4 py-8 transition hover:border-emerald-700/40">
            <Upload className="h-6 w-6 text-emerald-800/60" />
            <span className="text-center text-xs text-zinc-600">
              {file ? file.name : "แตะเพื่อเลือกไฟล์ (JPG, PNG, WebP, PDF — สูงสุด 5MB)"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full bg-emerald-800 text-white hover:bg-emerald-800/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังส่ง…
            </>
          ) : (
            "ส่งข้อมูล"
          )}
        </Button>
      </form>
    </div>
  );
}
