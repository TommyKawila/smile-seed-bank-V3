"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function TrackLiffTrafficController() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get("liff.state");
    if (!raw?.trim()) {
      router.replace("/");
      return;
    }

    try {
      let path = decodeURIComponent(raw.trim());
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      router.replace(path);
    } catch {
      router.replace("/");
    }
  }, [router, searchParams]);

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
