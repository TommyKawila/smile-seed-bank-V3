"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

const COOKIE_NAME = "smil_age_verified";
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

export function AgeVerificationGate() {
  const { user, isLoading } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      setOpen(false);
      return;
    }
    if (hasAgeCookie()) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [isLoading, user]);

  function onConfirm() {
    setAgeCookie();
    setOpen(false);
  }

  function onExit() {
    window.location.href = "https://www.google.com";
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={() => {}} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "relative fixed left-[50%] top-[50%] z-[100] w-[calc(100%-1.5rem)] max-w-md translate-x-[-50%] translate-y-[-50%]",
            "rounded-2xl border border-emerald-800/25 bg-white p-6 pt-7 shadow-2xl ring-1 ring-emerald-900/10",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "focus:outline-none"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div
            className="absolute right-4 top-4 z-10 flex overflow-hidden rounded-sm border border-zinc-200/90 bg-white text-[11px] font-semibold text-zinc-700 shadow-sm"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
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
                className="h-10 w-auto object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
          </div>

          <DialogPrimitive.Title asChild>
            <div className="flex flex-col gap-1.5 text-center">
              <span className="font-sans text-lg font-semibold leading-snug text-zinc-900 sm:text-xl">
                {TITLE_TH}
              </span>
              <span className="font-sans text-base font-medium leading-snug text-zinc-500 sm:text-lg">
                {TITLE_EN}
              </span>
            </div>
          </DialogPrimitive.Title>

          <div className="mt-5 space-y-2.5 text-center text-sm leading-relaxed">
            <p className="text-zinc-800">{BODY_TH}</p>
            <p className="text-zinc-500">{BODY_EN}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="h-11 w-full bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:min-w-[180px] sm:w-auto"
              onClick={onConfirm}
            >
              ยืนยัน (I am 20+)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-emerald-800/25 text-zinc-800 hover:bg-emerald-50 sm:min-w-[180px] sm:w-auto"
              onClick={onExit}
            >
              ออก (Exit)
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
