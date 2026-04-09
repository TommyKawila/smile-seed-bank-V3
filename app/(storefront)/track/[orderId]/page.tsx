"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

type TrackPayload = {
  orderNumber: string;
  status: string | null;
  statusLabelEn: string;
  statusLabelTh: string;
  trackingNumber: string | null;
  shippingProvider: string | null;
  lineLinked: boolean;
};

function TrackOrderInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const raw = params?.orderId;
  const orderId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  const success = searchParams.get("success") === "true";
  const oauthError = searchParams.get("error");

  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) {
      setError("ลิงก์ไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "โหลดไม่สำเร็จ");
        setData(null);
        return;
      }
      setData(json as TrackPayload);
    } catch {
      setError("เครือข่ายผิดพลาด");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const showLinked = data?.lineLinked ?? false;
  const connectHref = `/api/line/login?orderId=${encodeURIComponent(orderId)}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700/10 text-emerald-800">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">ติดตามออเดอร์</h1>
            <p className="text-xs text-zinc-500">Smile Seed Bank</p>
          </div>
        </div>

        {success && (
          <p
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900"
            role="status"
          >
            เชื่อม LINE สำหรับแจ้งเตือนแล้ว
          </p>
        )}

        {oauthError && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
            {oauthError === "auth_failed"
              ? "เชื่อม LINE ไม่สำเร็จ ลองใหม่อีกครั้ง"
              : `ไม่สามารถเชื่อม LINE ได้ (${oauthError})`}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
            กำลังโหลด...
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && data && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">เลขที่ออเดอร์</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-900">#{data.orderNumber}</p>
            </div>

            {showLinked ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                LINE Linked ✅
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-600">รับแจ้งเตือนจัดส่งผ่าน LINE (ไม่บังคับ)</p>
                <Button asChild className="w-full bg-emerald-700 text-white hover:bg-emerald-800">
                  <Link href={connectHref}>Connect LINE Notifications</Link>
                </Button>
              </div>
            )}

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
              <p className="text-xs text-zinc-500">สถานะ</p>
              <p className="mt-0.5 font-medium text-zinc-900">{data.statusLabelTh}</p>
              <p className="text-xs text-zinc-500">{data.statusLabelEn}</p>
            </div>

            {(data.trackingNumber || data.shippingProvider) && (
              <div className="flex gap-3 rounded-xl border border-emerald-700/15 bg-emerald-50/50 px-4 py-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
                <div>
                  <p className="text-xs font-medium text-emerald-900/80">เลขพัสดุ</p>
                  {data.trackingNumber ? (
                    <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">{data.trackingNumber}</p>
                  ) : (
                    <p className="mt-1 text-zinc-600">—</p>
                  )}
                  {data.shippingProvider ? (
                    <p className="mt-1 text-xs text-zinc-600">ขนส่ง: {data.shippingProvider}</p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-14">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            กำลังโหลด...
          </div>
        </div>
      }
    >
      <TrackOrderInner />
    </Suspense>
  );
}
