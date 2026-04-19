"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { lineOaUrlWithOrderHint } from "@/lib/line-oa-url";

const orderMono = JetBrains_Mono({ subsets: ["latin"] });

function LineBrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.345.282-.63.63-.63.212 0 .392.091.511.25l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.269 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.086.766.062 1.08l-.02.194c-.028.317-.248.617-.59.723-.094.03-.198.042-.298.042-.146 0-.294-.03-.437-.088-5.615-2.024-9.576-7.19-9.576-12.75C0 5.445 5.373.572 12 .572S24 5.445 24 10.314"
      />
    </svg>
  );
}

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

  const isSuccess = done;
  const successBlockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isSuccess) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        successBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [isSuccess]);

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
          : "ส่งเรียบร้อย";
    const subTh = claimInfo?.linked
      ? "เชื่อมบัญชีแล้ว · อัปเดตที่อยู่ในโปรไฟล์"
      : "รับที่อยู่และสลิปแล้ว · รอตรวจสอบ";
    const loginEmail = shipping_email.trim();
    const orderNo = preview?.order_number?.trim() ?? "";
    const lineTrackHref = orderNo ? lineOaUrlWithOrderHint(orderNo) : "";
    return (
      <motion.div
        ref={successBlockRef}
        className="mx-auto max-w-md scroll-mt-4 space-y-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-5 text-center shadow-sm sm:space-y-5 sm:p-7"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="space-y-1">
          <p className="text-base font-medium text-emerald-900">{headline}</p>
          <p className="text-sm text-emerald-800/90">{subTh}</p>
        </div>
        {lineTrackHref ? (
          <div className="rounded-xl border border-[#06C755]/40 bg-white p-3 text-left shadow-sm sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#05804a]">
              แจ้งเตือนผ่าน LINE
            </p>
            <p className="mt-1.5 text-xs leading-snug text-zinc-700">
              แตะปุ่มด้านล่าง แล้วกด <span className="font-medium">ส่ง</span> ใน LINE
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
              Open chat, then tap <span className="font-medium">Send</span> to enable tracking.
            </p>
            <Button
              asChild
              className="mt-3 h-11 w-full bg-[#06C755] text-sm text-white hover:bg-[#05b34c] sm:h-12"
            >
              <a href={lineTrackHref} target="_blank" rel="noopener noreferrer">
                Track on LINE
              </a>
            </Button>
          </div>
        ) : null}
        <Button
          asChild
          variant="outline"
          className="h-11 w-full border-emerald-800/35 text-emerald-900 hover:bg-emerald-50 sm:h-12"
        >
          <Link href={`/order/status/${encodeURIComponent(token)}`}>
            Check Order Status
          </Link>
        </Button>
        {claimInfo?.showSetPassword && loginEmail ? (
          <Button asChild variant="outline" className="h-10 w-full border-emerald-800/30 text-sm text-emerald-900">
            <Link href={`/login?email=${encodeURIComponent(loginEmail)}`}>
              ตั้งรหัสผ่าน (ไม่บังคับ)
            </Link>
          </Button>
        ) : null}
        <p className="text-[11px] text-emerald-900/70">
          เก็บลิงก์สถานะไว้ดูเลขพัสดุภายหลัง
        </p>
      </motion.div>
    );
  }

  const orderNo = preview?.order_number?.trim() ?? "";
  const lineTrackHref = orderNo ? lineOaUrlWithOrderHint(orderNo) : "";

  return (
    <div className="relative mx-auto max-w-lg px-1">
      {submitting ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-zinc-950/55 px-6 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white px-6 py-8 text-center shadow-xl">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-700" />
            <p className="mt-4 text-base font-medium text-zinc-900">
              กำลังบันทึกข้อมูล…
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Saving your info… Please don&apos;t close, almost done!
            </p>
          </div>
        </div>
      ) : null}

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
        {lineTrackHref ? (
          <div className="rounded-xl border border-[#06C755]/35 bg-emerald-50/60 p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#06C755] text-white">
                <LineBrandMark className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#047857]">
                  LINE Tracking Status
                </p>
                <p className="text-xs leading-snug text-zinc-800">
                  รับแจ้งเลขพัสดุผ่าน LINE ทันทีเมื่อจัดส่ง
                </p>
                <p className="text-[11px] leading-snug text-zinc-500">
                  Link LINE now to get tracking updates
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="mt-3 h-9 w-full bg-[#06C755] text-xs text-white hover:bg-[#05b34c] sm:h-10 sm:text-sm"
            >
              <a href={lineTrackHref} target="_blank" rel="noopener noreferrer">
                Track on LINE
              </a>
            </Button>
          </div>
        ) : null}

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

        <p className="rounded-lg border border-zinc-200/80 bg-zinc-50/90 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
          <span className="block text-zinc-600">
            หลังกดส่ง กรุณาอยู่หน้านี้สักครู่เพื่อยืนยันการเชื่อม LINE
          </span>
          <span className="mt-0.5 block text-zinc-500">
            After clicking submit, please stay on this page to confirm your LINE tracking link.
          </span>
        </p>

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
