"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "in-app-browser-banner-dismissed-v1";

function isFacebookOrInstagramInApp(ua: string): boolean {
  return /FBAN|FBAV|Instagram|FB_IAB/i.test(ua);
}

export function BrowserDetectionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(isFacebookOrInstagramInApp(navigator.userAgent));
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="In-app browser notice"
      className={cn(
        "sticky top-0 z-[100] border-b border-amber-200/80 bg-amber-50 px-3 py-2.5 text-center text-sm text-amber-950 shadow-sm",
      )}
    >
      <div className="mx-auto flex max-w-3xl items-start gap-2 pr-8">
        <p className="min-w-0 flex-1 leading-snug">
          เพื่อการใช้งานที่สมบูรณ์และรองรับ Google Login กรุณากดปุ่ม{" "}
          <span className="inline font-semibold">[ ⋮ ]</span> มุมขวาบนแล้วเลือก &quot;เปิดในเบราว์เซอร์&quot; (Open
          in Browser)
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-amber-800 hover:bg-amber-100"
          aria-label="ปิด"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
