"use client";

import { useCallback, useState } from "react";
import { Check, Facebook, Link2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type Props = { url: string; title?: string };

function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.345.282-.63.63-.63.212 0 .391.091.51.25l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.54 6.916-4.078 9.436-8.357C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

export function MagazineArticleShare({ url, title = "" }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [url]);

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const lineHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

  return (
    <div
      className="border-t border-zinc-200 pt-10"
      role="group"
      aria-label={
        title
          ? `${t("แบ่งปันประสบการณ์", "Share")}: ${title}`
          : t("แบ่งปันประสบการณ์", "Share article")
      }
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {t("แบ่งปันประสบการณ์", "Share")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
          aria-label={t("แชร์บน Facebook", "Share on Facebook")}
        >
          <Facebook className="h-4 w-4" />
        </a>
        <a
          href={lineHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
          aria-label={t("แชร์บน LINE", "Share on LINE")}
        >
          <LineIcon className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
          aria-label={t("คัดลอกลิงก์", "Copy link")}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
          {copied ? t("คัดลอกแล้ว", "Copied") : t("คัดลอกลิงก์", "Copy link")}
        </button>
      </div>
    </div>
  );
}
