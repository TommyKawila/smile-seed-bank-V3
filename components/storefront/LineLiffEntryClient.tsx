"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Button } from "@/components/ui/button";
import { LIFF_DEFAULT_REDIRECT } from "@/lib/line-liff-config";
import { getLineOaBaseUrl } from "@/lib/line-oa-url";
import { appendLineOpenExternalBrowserParam } from "@/lib/line-open-external-browser";
import { safeNextPath } from "@/lib/safe-redirect-path";

type Props = {
  liffId: string;
  nextPath: string;
};

type EntryPhase = "loading" | "error";

export function LineLiffEntryClient({ liffId, nextPath }: Props) {
  const [phase, setPhase] = useState<EntryPhase>("loading");
  const [errorCode, setErrorCode] = useState<string>("unknown");

  const redirectTarget = safeNextPath(nextPath) ?? LIFF_DEFAULT_REDIRECT;

  const externalShopUrl = useMemo(() => {
    const base =
      (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
        (typeof window !== "undefined" ? window.location.origin : "")) + redirectTarget;
    return appendLineOpenExternalBrowserParam(base);
  }, [redirectTarget]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!liffId) {
        if (!cancelled) {
          setErrorCode("missing_liff_id");
          setPhase("error");
        }
        return;
      }

      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId });

        if (!liff.isInClient()) {
          if (!cancelled) {
            setErrorCode("outside_line");
            setPhase("error");
          }
          return;
        }

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          if (!cancelled) {
            setErrorCode("missing_token");
            setPhase("error");
          }
          return;
        }

        const res = await fetch("/api/line/liff/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken, next: redirectTarget }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          redirect?: string;
          error?: string;
        };

        if (!res.ok || !data.ok) {
          if (!cancelled) {
            setErrorCode(data.error ?? "session_failed");
            setPhase("error");
          }
          return;
        }

        const dest = safeNextPath(data.redirect ?? null) ?? redirectTarget;
        window.location.assign(dest);
      } catch {
        if (!cancelled) {
          setErrorCode("init_failed");
          setPhase("error");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [liffId, redirectTarget]);

  if (phase === "error") {
    const isOutsideLine = errorCode === "outside_line";
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">
          {isOutsideLine ? "เปิดจากแชท LINE" : "เข้าสู่ระบบไม่สำเร็จ"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {isOutsideLine
            ? "กรุณากดปุ่มจากแชท Smile Seed Bank ในแอป LINE"
            : errorCode === "missing_token"
              ? "LIFF ต้องเปิด scope openid + profile ใน LINE Developers"
              : errorCode === "invalid_token"
                ? "LINE channel ID ไม่ตรงกับ LIFF app (ตรวจ LINE_LOGIN_CHANNEL_ID)"
                : errorCode === "sync_failed"
                  ? "สร้าง/ซิงก์บัญชีไม่สำเร็จ (ตรวจ SUPABASE_SERVICE_ROLE_KEY บน Vercel)"
                  : errorCode === "otp_failed" || errorCode === "link_failed"
                    ? "ตั้ง session ไม่สำเร็จ — ลองใหม่หรือเปิดในเบราว์เซอร์"
                    : "ลองใหม่อีกครั้ง หรือเปิดร้านในเบราว์เซอร์"}
        </p>
        {!isOutsideLine && errorCode !== "unknown" ? (
          <p className="mt-2 font-mono text-xs text-zinc-400">code: {errorCode}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            ลองใหม่
          </Button>
          <Button type="button" asChild>
            <Link href={externalShopUrl}>เปิดร้าน</Link>
          </Button>
          {isOutsideLine ? (
            <Button type="button" variant="ghost" asChild>
              <Link href={getLineOaBaseUrl()}>ไปแชท LINE</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-800" aria-hidden />
      <p className="mt-4 text-sm font-medium text-zinc-700">กำลังเข้าสู่ร้าน…</p>
      <p className="mt-1 text-xs text-zinc-500">Signing you in via LINE</p>
    </div>
  );
}
