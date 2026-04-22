"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { appendLineOpenExternalBrowserParam } from "@/lib/line-flex";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. z-[200] to stack above other dialogs */
  className?: string;
};

export function LineInAppGoogleOverlay({ open, onOpenChange, className }: Props) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open) return null;

  const tryOpenExternal = () => {
    if (typeof window === "undefined") return;
    const next = appendLineOpenExternalBrowserParam(window.location.href);
    window.location.replace(next);
  };

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="line-in-app-google-title"
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-zinc-950/85 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <div className="max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
        <h2
          id="line-in-app-google-title"
          className="text-center text-lg font-bold leading-snug text-zinc-900"
        >
          {t("เข้าสู่ระบบด้วย Google", "Sign in with Google")}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-600">
          {t(
            "กรุณาเปิดหน้านี้ในเบราว์เซอร์ของระบบ (Safari หรือ Chrome) เพื่อลงชื่อเข้าใช้ Google",
            "To sign in with Google, please open this page in your system browser (Safari or Chrome).",
          )}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-2 text-left text-xs text-zinc-600">
            <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
              1
            </span>
            <span>
              {t("แตะปุ่ม", "Tap the")}{" "}
              <span className="font-semibold text-zinc-800">⋮</span>{" "}
              {t("(จุดสามจุด) มุมขวาบน", "(three dots) in the top-right corner")}
            </span>
          </div>
          <div className="rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300/80 bg-white shadow-sm"
                aria-hidden
              >
                <MoreVertical className="h-5 w-5 text-zinc-700" />
              </div>
            </div>
            <div className="mt-2 h-1.5 w-2/3 rounded bg-zinc-200/80" />
          </div>

          <div className="flex items-start gap-2 text-left text-xs text-zinc-600">
            <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
              2
            </span>
            <span>
              {t("เลือก", "Choose")}{" "}
              <span className="font-semibold text-zinc-800">
                {t("เปิดในเบราว์เซอร์", "Open in external browser")}
              </span>{" "}
              {t("หรือคำที่คล้ายกัน", "or similar")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#06C755]/50 bg-[#06C755]/5 px-3 py-2.5 text-sm font-medium text-[#047c3d]">
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t("เปิดในเบราว์เซอร์ / Open in Browser", "Open in browser")}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button type="button" className="h-11 w-full font-semibold" onClick={() => void tryOpenExternal()}>
            {t("ลองเปิดในเบราว์เซอร์ (แนะนำ)", "Try opening in system browser")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full font-medium"
            onClick={() => onOpenChange(false)}
          >
            {t("ใช้ LINE หรืออีเมลแทน", "Continue with LINE or email instead")}
          </Button>
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-400">
          {t(
            "LINE ฝังเบราว์เซอร์ไม่รองรับ Google Login — นี่คือข้อกำหนดของ Google ไม่ใช่ร้านค้า",
            "LINE’s in-app browser can’t complete Google sign-in (Google’s policy, not the store’s).",
          )}
        </p>
      </div>
    </div>
  );

  if (typeof document === "undefined" || !mounted) return null;
  return createPortal(node, document.body);
}
