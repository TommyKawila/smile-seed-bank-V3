"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";
import type { Liff } from "@line/liff";
import { CheckCircle2, Loader2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isLiffClientFeaturesError,
  LIFF_LOGIN_ATTEMPT_KEY,
  LIFF_REDIRECT_PATH_KEY,
} from "@/lib/liff-track-path";

type TrackPayload = {
  orderNumber: string;
  status: string | null;
  statusLabelEn: string;
  statusLabelTh: string;
  trackingNumber: string | null;
  shippingProvider: string | null;
  lineLinked: boolean;
};

declare global {
  interface Window {
    liff?: Liff;
  }
}

const STEP1 = "Step 1: Initializing LINE...";
const STEP2 = "Step 2: Authenticating...";
const STEP3 = "Step 3: Linking your Order...";

const LIFF_CDN = "https://static.line-scdn.net/liff/edge/2/sdk.js";

export default function TrackOrderPage() {
  const params = useParams();
  const raw = params?.orderId;
  const orderId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liffInitError, setLiffInitError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [claimPhase, setClaimPhase] = useState<string | null>(null);
  const [lineLinkedLocal, setLineLinkedLocal] = useState(false);
  const [forbiddenWarning, setForbiddenWarning] = useState<string | null>(null);
  const [claimNote, setClaimNote] = useState<string | null>(null);
  const [liffSdkReady, setLiffSdkReady] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [manualLoginMode, setManualLoginMode] = useState<null | "features" | "max_attempts">(null);

  const claimAttemptedRef = useRef(false);
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
      const res = await fetch(`/api/track/${encodeURIComponent(orderId)}`, { cache: "no-store" });
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
    claimAttemptedRef.current = false;
    setManualLoginMode(null);
  }, [orderId]);

  useEffect(() => {
    console.log("🍎 [track] useEffect entry", { orderId, loading, hasData: !!data, liffSdkReady, ts: Date.now() });

    if (!orderId || loading || !data) {
      console.log("🍊 [track] guard: skip (no orderId | loading | !data)");
      return;
    }

    if (data.lineLinked) {
      console.log("🍋 [track] guard: skip lineLinked from API", { orderId, ts: Date.now() });
      setClaimPhase(null);
      setLiffInitError(null);
      setApiError(null);
      return;
    }

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
    if (!liffId) {
      console.log("🍎 [track] guard: skip — NEXT_PUBLIC_LIFF_ID missing");
      return;
    }

    if (!liffSdkReady) {
      console.log("🍊 [track] guard: wait — LIFF script not loaded yet (onLoad not fired)");
      return;
    }

    if (typeof window !== "undefined" && !window.liff) {
      console.log("🍋 [track] guard: script loaded but window.liff missing");
      setLiffInitError("LINE SDK did not attach to window after script load.");
      return;
    }

    if (claimAttemptedRef.current) {
      console.log("🍎 [track] guard: skip — claim already attempted (loop guard)", { orderId, ts: Date.now() });
      return;
    }
    claimAttemptedRef.current = true;
    console.log("🍊 [track] guards passed — set Step 1 BEFORE liff.init / async", { orderId, ts: Date.now() });

    setClaimPhase(STEP1);
    console.log("🍋 [track] setClaimPhase(STEP1) sync — if you do not see Step 1, useEffect deps issue", {
      orderId,
      ts: Date.now(),
    });

    let cancelled = false;

    const handleLineClaim = async () => {
      console.log("🍎 [track] handleLineClaim start", { orderId, ts: Date.now() });
      const liff = typeof window !== "undefined" ? window.liff : undefined;
      console.log("🍊 [track] window.liff present?", { hasLiff: !!liff, ts: Date.now() });

      setLiffInitError(null);
      setApiError(null);
      setForbiddenWarning(null);
      setClaimNote(null);

      try {
        console.log("🍋 [track] try: init block", { orderId, ts: Date.now() });
        if (!liff) {
          console.log("🍎 [track] abort: no liff ref");
          setLiffInitError("LIFF SDK unavailable.");
          setClaimPhase(null);
          return;
        }

        console.log("🍊 [track] await liff.init", { orderId, liffId, ts: Date.now() });
        try {
          await liff.init({ liffId });
        } catch (initErr) {
          const msg = initErr instanceof Error ? initErr.message : String(initErr);
          console.log("🍎 [track] liff.init failed", initErr);
          if (isLiffClientFeaturesError(msg)) {
            setManualLoginMode("features");
            setClaimPhase(null);
            claimAttemptedRef.current = true;
            return;
          }
          throw initErr;
        }
        console.log("🍋 [track] liff.init resolved", { orderId, ts: Date.now() });

        if (cancelled) {
          console.log("🍎 [track] cancelled after init");
          return;
        }

        const inClient = liff.isInClient();
        const loggedIn = liff.isLoggedIn();
        console.log("🍊 [track] flags", { orderId, inClient, loggedIn, ts: Date.now() });

        setClaimPhase(STEP2);
        console.log("🍋 [track] setClaimPhase STEP2", { ts: Date.now() });

        if (!loggedIn) {
          console.log("🍎 [track] liff.login (default redirect = LIFF endpoint / root)", {
            orderId,
            ts: Date.now(),
          });
          try {
            localStorage.setItem(LIFF_REDIRECT_PATH_KEY, window.location.pathname);
          } catch {
            /* private mode */
          }
          let attempts = 0;
          try {
            attempts = parseInt(sessionStorage.getItem(LIFF_LOGIN_ATTEMPT_KEY) || "0", 10);
          } catch {
            /* ignore */
          }
          if (attempts >= 3) {
            setManualLoginMode("max_attempts");
            setClaimPhase(null);
            claimAttemptedRef.current = true;
            return;
          }
          try {
            sessionStorage.setItem(LIFF_LOGIN_ATTEMPT_KEY, String(attempts + 1));
          } catch {
            /* ignore */
          }
          claimAttemptedRef.current = false;
          liff.login();
          setClaimPhase(null);
          return;
        }

        try {
          sessionStorage.removeItem(LIFF_LOGIN_ATTEMPT_KEY);
        } catch {
          /* ignore */
        }

        setClaimPhase(STEP3);
        console.log("🍊 [track] setClaimPhase STEP3 + getProfile", { ts: Date.now() });

        const profile = await liff.getProfile();
        console.log("🍋 [track] getProfile done", { orderId, ts: Date.now() });

        if (cancelled) return;
        const lineUserId = profile.userId;

        const claimUrl = `/api/track/${encodeURIComponent(orderId)}/claim`;
        console.log("🍎 [track] POST claim", { claimUrl, ts: Date.now() });

        try {
          const res = await fetch(claimUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId }),
            cache: "no-store",
          });

          let json: { ok?: boolean; alreadyLinked?: boolean; error?: string } = {};
          try {
            json = (await res.json()) as typeof json;
          } catch {
            json = {};
          }

          console.log("🍊 [track] claim response", { orderId, status: res.status, json, ts: Date.now() });

          if (cancelled) return;

          if (res.status === 403) {
            setForbiddenWarning(
              typeof json.error === "string"
                ? json.error
                : "This order is already linked to another LINE account."
            );
            setClaimPhase(null);
            return;
          }

          if (!res.ok) {
            const detail =
              typeof json.error === "string" && json.error.length > 0 ? json.error : res.statusText || "Unknown";
            setApiError(`API Error: ${res.status} — ${detail}`);
            setClaimPhase(null);
            return;
          }

          if (!json.ok) {
            setApiError(
              `API Error: ${res.status} — ${typeof json.error === "string" ? json.error : "ok=false"}`
            );
            setClaimPhase(null);
            return;
          }

          setLineLinkedLocal(true);
          setClaimNote(
            json.alreadyLinked
              ? "Already linked to your LINE — notifications enabled."
              : "LINE linked — you will get shipping alerts."
          );
          setClaimPhase(null);
          void load();
        } catch (fetchErr) {
          const msg =
            fetchErr instanceof Error ? fetchErr.message : typeof fetchErr === "string" ? fetchErr : "Unknown";
          console.log("🍋 [track] fetch catch", fetchErr);
          setApiError(`Fetch failed: ${msg}`);
          setClaimPhase(null);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : typeof err === "string" ? err : "LIFF init or profile failed";
        console.log("🍎 [track] outer catch", err);
        setLiffInitError(msg);
        setClaimPhase(null);
      }
    };

    console.log("🍊 [track] scheduling handleLineClaim()", { ts: Date.now() });
    void handleLineClaim();

    return () => {
      console.log("🍋 [track] useEffect cleanup", { orderId, ts: Date.now() });
      cancelled = true;
    };
  }, [orderId, loading, data, load, liffSdkReady, retryTick]);

  const showLinked = lineLinkedLocal || (data?.lineLinked ?? false);
  const liffIdForUi = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  const waitingForSdk =
    !!liffIdForUi && !loading && !!data && !data.lineLinked && !liffSdkReady;

  const showLinkPrompt =
    !loading &&
    data &&
    !showLinked &&
    !claimPhase &&
    !forbiddenWarning &&
    !liffInitError &&
    !apiError &&
    !waitingForSdk &&
    !manualLoginMode;

  const claiming = Boolean(claimPhase);

  const handleTryAgain = () => {
    claimAttemptedRef.current = false;
    setManualLoginMode(null);
    setLiffInitError(null);
    setApiError(null);
    setForbiddenWarning(null);
    setClaimNote(null);
    setClaimPhase(null);
    setRetryTick((t) => t + 1);
  };

  const handleManualLogin = () => {
    const liff = typeof window !== "undefined" ? window.liff : undefined;
    if (!liff) {
      setLiffInitError("LIFF SDK unavailable.");
      return;
    }
    setManualLoginMode(null);
    setLiffInitError(null);
    try {
      localStorage.setItem(LIFF_REDIRECT_PATH_KEY, window.location.pathname);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(LIFF_LOGIN_ATTEMPT_KEY);
    } catch {
      /* ignore */
    }
    claimAttemptedRef.current = false;
    liff.login();
  };

  const showTryAgain =
    !loading &&
    !!data &&
    !showLinked &&
    (Boolean(liffInitError) || Boolean(apiError));

  return (
    <>
      <Script
        id="liff-sdk"
        src={LIFF_CDN}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("🍎 [track] Script onLoad LIFF CDN", { ts: Date.now(), iso: new Date().toISOString() });
          setLiffSdkReady(true);
        }}
        onError={(e) => {
          console.error("🍊 [track] Script onError", e);
          setLiffInitError("Failed to load LINE SDK script.");
        }}
      />

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

          {waitingForSdk && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-700" />
              Waiting for LINE SDK…
            </div>
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

          {claiming && claimPhase && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-700" />
              <span>{claimPhase}</span>
            </div>
          )}

          {manualLoginMode && (
            <div
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm text-amber-950"
              role="status"
            >
              <p className="mb-2 text-xs leading-relaxed">
                {manualLoginMode === "features"
                  ? "LINE could not load in-app features in this environment. Use the button below to sign in with LINE in the browser."
                  : "Automatic LINE login was tried several times. Use manual login to continue."}
              </p>
              <Button
                type="button"
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleManualLogin}
              >
                Manual Login with LINE
              </Button>
            </div>
          )}

          {liffInitError && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
              LIFF: {liffInitError}
            </p>
          )}

          {apiError && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
              {apiError}
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
                  เปิดลิงก์นี้ในแอป LINE หรือล็อกอิน LINE แล้วกลับมาหน้านี้เพื่อเชื่อมบัญชีและรับแจ้งเตือนเมื่อจัดส่ง
                </p>
              )}

              {showTryAgain && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-emerald-700/30 text-emerald-900 hover:bg-emerald-50"
                  onClick={handleTryAgain}
                >
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 break-all text-center font-mono text-[10px] leading-relaxed text-zinc-400">
          LIFF_ID: {liffIdDisplay}
        </p>
      </div>
    </>
  );
}
