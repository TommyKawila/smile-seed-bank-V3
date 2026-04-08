"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import liff from "@line/liff";
import { Loader2, Package, Truck } from "lucide-react";

type TrackPayload = {
  orderNumber: string;
  status: string | null;
  statusLabelEn: string;
  statusLabelTh: string;
  trackingNumber: string | null;
  shippingProvider: string | null;
  lineLinked: boolean;
};

export default function TrackOrderPage() {
  const params = useParams();
  const raw = params?.orderId;
  const orderId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const claimStarted = useRef(false);

  useEffect(() => {
    claimStarted.current = false;
  }, [orderId]);

  const load = useCallback(async () => {
    if (!orderId) {
      setError("ลิงก์ไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(orderId)}`);
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

  useEffect(() => {
    if (!orderId) return;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId?.trim()) return;
    const storageKey = `track-liff-claim-${orderId}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) return;
    if (claimStarted.current) return;
    claimStarted.current = true;

    let cancelled = false;
    void (async () => {
      try {
        await liff.init({ liffId });
        if (cancelled || !liff.isInClient()) return;
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const res = await fetch(`/api/track/${encodeURIComponent(orderId)}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          if (typeof sessionStorage !== "undefined") sessionStorage.setItem(storageKey, "1");
          setClaimMsg(
            json.alreadyLinked
              ? "เชื่อม LINE กับออเดอร์นี้แล้ว — จะได้รับแจ้งเตือนเมื่อจัดส่ง"
              : "เชื่อม LINE สำเร็จ — จะได้รับแจ้งเตือนเมื่อจัดส่ง"
          );
          void load();
        } else if (typeof json.error === "string") {
          setClaimMsg(json.error);
        }
      } catch {
        /* LIFF ไม่พร้อมหรือไม่ได้เปิดใน LINE — ข้ามการ claim */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, load]);

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

            {claimMsg && (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                {claimMsg}
              </p>
            )}

            {!data.lineLinked && !claimMsg && (
              <p className="text-xs text-zinc-500">
                เปิดลิงก์นี้ในแอป LINE เพื่อเชื่อมบัญชีและรับแจ้งเตือนอัตโนมัติเมื่อจัดส่ง
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
