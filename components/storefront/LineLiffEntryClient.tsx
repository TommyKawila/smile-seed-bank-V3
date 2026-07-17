"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Button } from "@/components/ui/button";
import { LIFF_DEFAULT_REDIRECT } from "@/lib/line-liff-config";
import { ensureLiffReady } from "@/lib/liff-client";
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
  const [errorDetail, setErrorDetail] = useState<string>("");

  const redirectTarget = safeNextPath(nextPath) ?? LIFF_DEFAULT_REDIRECT;

  const externalShopUrl = useMemo(() => {
    const base =
      (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
        (typeof window !== "undefined" ? window.location.origin : "")) + redirectTarget;
    return appendLineOpenExternalBrowserParam(base);
  }, [redirectTarget]);

  useEffect(() => {
    let cancelled = false;

    async function fail(code: string, detail = "") {
      if (cancelled) return;
      setErrorCode(code);
      setErrorDetail(detail);
      setPhase("error");
    }

    async function run() {
      if (!liffId) {
        await fail("missing_liff_id");
        return;
      }

      let liff;
      try {
        liff = await ensureLiffReady(liffId);
      } catch (e) {
        const detail = e instanceof Error ? e.message : "liff_init";
        await fail("init_failed", detail);
        return;
      }

      if (!liff.isInClient()) {
        await fail("outside_line");
        return;
      }

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const idToken = liff.getIDToken();
      if (!idToken) {
        await fail("missing_token");
        return;
      }

      let res: Response;
      try {
        res = await fetch("/api/line/liff/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken, next: redirectTarget }),
        });
      } catch (e) {
        const detail = e instanceof Error ? e.message : "network";
        await fail("network_failed", detail);
        return;
      }

      let data: { ok?: boolean; redirect?: string; error?: string };
      try {
        data = (await res.json()) as { ok?: boolean; redirect?: string; error?: string };
      } catch {
        await fail("bad_response", `HTTP ${res.status}`);
        return;
      }

      if (!res.ok || !data.ok) {
        await fail(data.error ?? "session_failed");
        return;
      }

      const dest = safeNextPath(data.redirect ?? null) ?? redirectTarget;
      window.location.assign(dest);
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
        <h1 className="text-lg font-semibold text-foreground">
          {isOutsideLine ? "เปิดจากแชท LINE" : "เข้าสู่ระบบไม่สำเร็จ"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOutsideLine
            ? "กรุณากดปุ่มจากแชท Smile Seed Bank ในแอป LINE"
            : errorCode === "init_failed"
              ? "LIFF ID หรือ Endpoint URL ไม่ตรง — ตรวจ NEXT_PUBLIC_LIFF_ID และ LINE Console"
              : errorCode === "network_failed" || errorCode === "bad_response"
                ? "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ — ลองใหม่"
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
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            code: {errorCode}
            {errorDetail ? ` · ${errorDetail}` : ""}
          </p>
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="mt-4 text-sm font-medium text-muted-foreground">กำลังเข้าสู่ร้าน…</p>
      <p className="mt-1 text-xs text-muted-foreground">Signing you in via LINE</p>
    </div>
  );
}
