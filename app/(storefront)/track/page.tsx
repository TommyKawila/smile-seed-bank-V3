"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Decode liff.state until stable (LINE may double-encode). */
function fullyDecodeState(value: string): string {
  let s = value.trim();
  for (let i = 0; i < 8; i++) {
    try {
      const next = decodeURIComponent(s);
      if (next === s) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

function normalizeTrackPath(raw: string): string {
  let targetPath = fullyDecodeState(raw);

  if (/^https?:\/\//i.test(targetPath)) {
    try {
      const u = new URL(targetPath);
      targetPath = u.pathname || "/";
    } catch {
      /* keep targetPath */
    }
  }

  const pathOnly = targetPath.split("?")[0]?.split("#")[0] ?? targetPath;

  targetPath = pathOnly;
  if (!targetPath.startsWith("/track")) {
    targetPath = `/track${targetPath.startsWith("/") ? "" : "/"}${targetPath}`;
  }

  return targetPath;
}

function TrackLiffTrafficController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectDebug, setRedirectDebug] = useState<{
    error: string;
    targetPath: string;
  } | null>(null);

  useEffect(() => {
    const raw = searchParams.get("liff.state");
    if (!raw?.trim()) {
      router.replace("/");
      return;
    }

    try {
      const targetPath = normalizeTrackPath(raw);
      console.log("[track/liff.state] redirect", { raw, targetPath });
      router.replace(targetPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let targetPath = raw;
      try {
        targetPath = normalizeTrackPath(raw);
      } catch {
        /* leave raw for debug */
      }
      console.error("[track/liff.state] redirect failed", { raw, targetPath, err });
      setRedirectDebug({ error: msg, targetPath });
    }
  }, [router, searchParams]);

  if (redirectDebug) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16">
        <p className="text-center text-sm font-medium text-red-700">Redirect failed</p>
        <p className="max-w-full break-all rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800">
          {redirectDebug.error}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">targetPath (debug)</p>
        <p className="max-w-full break-all rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 font-mono text-xs text-emerald-900">
          {redirectDebug.targetPath}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-700" aria-hidden />
      <p className="text-center text-sm text-zinc-600">กำลังนำคุณไปยังหน้าข้อมูลออเดอร์...</p>
    </div>
  );
}

export default function TrackTrafficControllerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-700" aria-hidden />
          <p className="text-center text-sm text-zinc-600">กำลังนำคุณไปยังหน้าข้อมูลออเดอร์...</p>
        </div>
      }
    >
      <TrackLiffTrafficController />
    </Suspense>
  );
}
