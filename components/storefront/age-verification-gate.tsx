"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

const COOKIE_NAME = "smil_age_verified";
/** Same name as `document.cookie` entry — use from server layout for SSR-aligned initial open state. */
export const SMIL_AGE_VERIFIED_COOKIE_NAME = COOKIE_NAME;
const COOKIE_MAX_AGE_SEC = 24 * 60 * 60;

const TITLE_TH = "คุณมีอายุ 20 ปีขึ้นไปหรือไม่?";
const TITLE_EN = "Are you 20+?";

const BODY_TH =
  "เว็บไซต์นี้มีเนื้อหาเกี่ยวกับเมล็ดพันธุ์กัญชา สงวนสิทธิ์การเข้าชมเฉพาะผู้ที่มีอายุ 20 ปีขึ้นไปเท่านั้น";
const BODY_EN =
  "This website contains cannabis seed content. Access is restricted to individuals aged 20 and above only.";

function hasAgeCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}

function setAgeCookie(): void {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE_SEC}; path=/; SameSite=Lax${
    secure ? "; Secure" : ""
  }`;
}

export function AgeVerificationGate({
  initialVerifiedCookie = false,
}: {
  /** Server-read cookie — initial CSS visibility matches SSR (hydration-safe tree). */
  initialVerifiedCookie?: boolean;
}) {
  const { user, sessionHint, isLoading } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { settings } = useSiteSettings();
  /** When true, overlay is hidden via CSS only (DOM stays mounted). */
  const [isVerified, setIsVerified] = useState(initialVerifiedCookie);

  useEffect(() => {
    setIsVerified(initialVerifiedCookie);
  }, [initialVerifiedCookie]);

  useEffect(() => {
    if (user || sessionHint) {
      setIsVerified(true);
      return;
    }
    if (initialVerifiedCookie || hasAgeCookie()) {
      setIsVerified(true);
      return;
    }
    if (!isLoading) setIsVerified(false);
  }, [isLoading, user, sessionHint, initialVerifiedCookie]);

  useEffect(() => {
    if (isVerified) return;
    let cancelled = false;
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (!cancelled) document.documentElement.classList.add("overflow-hidden");
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [isVerified]);

  function onConfirm() {
    setAgeCookie();
    setIsVerified(true);
  }

  function onExit() {
    window.location.href = "https://www.google.com";
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-3 transition-opacity duration-300",
        isVerified
          ? "pointer-events-none invisible opacity-0"
          : "pointer-events-auto visible opacity-100"
      )}
      aria-hidden={isVerified}
      role="dialog"
      aria-modal={!isVerified}
      aria-labelledby="age-gate-title"
      onKeyDown={(e) => {
        if (isVerified) return;
        if (e.key === "Escape") e.preventDefault();
      }}
    >
      <div className="absolute inset-0 bg-zinc-950/95" aria-hidden />

      <div
        className={cn(
          "relative z-10 w-[calc(100%-1.5rem)] max-w-md rounded-2xl border border-emerald-800/25 bg-white p-6 pt-7 shadow-2xl ring-1 ring-emerald-900/10",
          "focus:outline-none",
          "[font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]"
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="absolute right-4 top-4 z-10 flex overflow-hidden rounded-sm border border-zinc-200/90 bg-white text-[11px] font-semibold text-zinc-700 shadow-sm"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            aria-label="Switch age gate language to Thai"
            onClick={() => setLocale("th")}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              locale === "th"
                ? "bg-emerald-700/95 text-white"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            TH
          </button>
          <button
            type="button"
            aria-label="Switch age gate language to English"
            onClick={() => setLocale("en")}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              locale === "en"
                ? "bg-emerald-700/95 text-white"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            EN
          </button>
        </div>

        <div className="mb-5 flex justify-center pr-14 sm:pr-16">
          {settings.logo_main_url ? (
            <Image
              src={settings.logo_main_url}
              alt="Smile Seed Bank"
              width={160}
              height={44}
              sizes="160px"
              className="h-10 w-auto object-contain"
              priority={true}
              fetchPriority="high"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
        </div>

        <div id="age-gate-title" className="flex flex-col gap-1.5 text-center">
          <span className="font-bold text-xl leading-snug text-foreground md:text-2xl">
            {TITLE_TH}
          </span>
          <span className="text-lg font-semibold leading-snug text-muted-foreground md:text-xl">
            {TITLE_EN}
          </span>
        </div>

        <div className="mt-5 space-y-2.5 text-center text-sm leading-relaxed md:text-base">
          <p className="text-foreground">{BODY_TH}</p>
          <p className="text-muted-foreground">{BODY_EN}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="h-11 w-full bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 [font-family:inherit] sm:min-w-[180px] sm:w-auto"
            onClick={onConfirm}
          >
            ยืนยัน (I am 20+)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-emerald-800/25 text-zinc-800 [font-family:inherit] hover:bg-emerald-50 sm:min-w-[180px] sm:w-auto"
            onClick={onExit}
          >
            ออก (Exit)
          </Button>
        </div>
      </div>
    </div>
  );
}
