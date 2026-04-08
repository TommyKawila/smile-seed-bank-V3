"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import liff from "@line/liff";
import { CheckCircle2, Loader2, Package, Truck } from "lucide-react";

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
  const [liffInitError, setLiffInitError] = useState<string | null>(null);
  /** True while POST /claim is in flight (after profile resolved). */
  const [linkingLine, setLinkingLine] = useState(false);
  /** Local success after claim API OK (or already linked same user). */
  const [lineLinkedLocal, setLineLinkedLocal] = useState(false);
  const [forbiddenWarning, setForbiddenWarning] = useState<string | null>(null);
  const [claimNote, setClaimNote] = useState<string | null>(null);

  const liffIdDisplay = process.env.NEXT_PUBLIC_LIFF_ID || "MISSING";

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
      const payload = json as TrackPayload;
      setData(payload);
      if (payload.lineLinked) setLineLinkedLocal(true);
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
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
    if (!liffId) {
      console.log("[track] skip LIFF: NEXT_PUBLIC_LIFF_ID missing");
      setLiffInitError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        console.log("[track] step: liff.init start", { orderId });
        await liff.init({ liffId });
        if (cancelled) return;
        console.log("[track] step: liff.init ok");

        const inClient = liff.isInClient();
        const loggedIn = liff.isLoggedIn();
        console.log("[track] step: flags", { orderId, inClient, loggedIn });

        if (!inClient) {
          console.log("[track] step: not in LINE in-app browser — skip auto-claim");
          return;
        }

        if (!loggedIn) {
          console.log("[track] step: not logged in — liff.login redirect");
          liff.login({ redirectUri: window.location.href });
          return;
        }

        console.log("[track] step: in client + logged in — getProfile immediately");
        const profile = await liff.getProfile();
        if (cancelled) return;
        const lineUserId = profile.userId;
        console.log("[track] step: userId received", {
          orderId,
          prefix: lineUserId.slice(0, 6) + "…",
        });

        setLinkingLine(true);
        setForbiddenWarning(null);
        setClaimNote(null);

        const claimUrl = `/api/track/${encodeURIComponent(orderId)}/claim`;
        console.log("[track] step: POST claim", { orderId, url: claimUrl });

        const res = await fetch(claimUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          alreadyLinked?: boolean;
          error?: string;
        };
        console.log("[track] step: claim response", {
          orderId,
          status: res.status,
          ok: json.ok,
          alreadyLinked: json.alreadyLinked,
        });

        if (cancelled) return;

        if (res.status === 403) {
          setForbiddenWarning(
            typeof json.error === "string"
              ? json.error
              : "This order is already linked to another LINE account."
          );
          setLinkingLine(false);
          return;
        }

        if (!res.ok || !json.ok) {
          setClaimNote(typeof json.error === "string" ? json.error : "Claim failed");
          setLinkingLine(false);
          return;
        }

        setLineLinkedLocal(true);
        setClaimNote(
          json.alreadyLinked
            ? "Already linked to your LINE — notifications enabled."
            : "LINE linked — you will get shipping alerts."
        );
        void load();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : "LIFF or claim failed";
        console.error("[track] step: error", err);
        setLiffInitError(msg);
      } finally {
        setLinkingLine(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [orderId, load]);

  const showLinked =
    lineLinkedLocal || (data?.lineLinked ?? false);
  const showLinkPrompt =
    !loading &&
    data &&
    !showLinked &&
    !linkingLine &&
    !forbiddenWarning &&
    !liffInitError;

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

        {liffInitError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
            LIFF: {liffInitError}
          </p>
        )}

        {forbiddenWarning && (
          <p
            className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            role="alert"
          >
            {forbiddenWarning}
          </p>
        )}

        {linkingLine && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-700" />
            <span>Linking your LINE account…</span>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">เลขที่ออเดอร์</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-900">#{data.orderNumber}</p>
            </div>

            {showLinked && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                LINE Linked ✅
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

            {claimNote && (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                {claimNote}
              </p>
            )}

            {showLinkPrompt && (
              <p className="text-xs text-zinc-500">
                เปิดลิงก์นี้ในแอป LINE เพื่อเชื่อมบัญชีและรับแจ้งเตือนอัตโนมัติเมื่อจัดส่ง
              </p>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 break-all text-center font-mono text-[10px] leading-relaxed text-zinc-400">
        LIFF_ID: {liffIdDisplay}
      </p>
    </div>
  );
}
