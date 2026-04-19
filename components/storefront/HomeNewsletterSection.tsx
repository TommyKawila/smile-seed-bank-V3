"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { cn } from "@/lib/utils";

export function HomeNewsletterSection() {
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setPending(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        welcomeEmailSent?: boolean;
        alreadyActive?: boolean;
      };
      if (res.status === 429) {
        setErr(
          t("ลองใหม่ภายหลัง — มีการส่งบ่อยเกินไป", "Too many attempts. Try again later.")
        );
        return;
      }
      if (!res.ok || !data.ok) {
        setErr(
          data.error ??
            t("อีเมลไม่ถูกต้องหรือบันทึกไม่สำเร็จ", "Invalid email or could not subscribe.")
        );
        return;
      }
      if (data.alreadyActive) {
        setMsg(
          t("คุณสมัครรับข่าวด้วยอีเมลนี้อยู่แล้ว", "You're already subscribed with this email.")
        );
      } else if (data.welcomeEmailSent) {
        setMsg(
          t(
            "สำเร็จ! ตรวจสอบอีเมลของคุณเพื่อรับโค้ด WELCOME10",
            "Success! Check your inbox for your WELCOME10 discount code."
          )
        );
      } else {
        setMsg(
          t(
            "ขอบคุณ — คุณอยู่ในรายชื่อแล้ว (หากไม่เห็นอีเมล กรุณาตรวจสแปม)",
            "Thanks — you're on the list. If you don't see our email, check spam."
          )
        );
      }
      setEmail("");
    } catch {
      setErr(t("เกิดข้อผิดพลาด", "Something went wrong"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className={cn(
        "mx-4 mb-14 overflow-hidden rounded-3xl border border-emerald-800/20 bg-emerald-800 sm:mx-6",
        JOURNAL_PRODUCT_FONT_VARS
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-stretch justify-between gap-8 px-6 py-10 sm:flex-row sm:items-center sm:gap-10">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h3 className="font-[family-name:var(--font-journal-product-serif)] text-xl font-medium leading-snug text-white sm:text-2xl">
            {t(
              "รับส่วนลด 10% สำหรับออเดอร์แรกของคุณ",
              "Get 10% off your first order"
            )}
          </h3>
          <p className="mt-2 text-sm font-light leading-relaxed text-white/90">
            {t(
              "สมัครรับข่าวสารเพื่อรับโค้ดส่วนลด และเทคนิคการปลูกจากผู้เชี่ยวชาญส่งตรงถึงอีเมลคุณ",
              "Join our newsletter for exclusive growing tips and get your discount code instantly."
            )}
          </p>
        </div>

        {msg ? (
          <p className="text-center text-sm font-medium text-emerald-100 sm:text-right" role="status">
            {msg}
          </p>
        ) : (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-shrink-0 sm:flex-row sm:items-center"
          >
            <label htmlFor="home-newsletter-email" className="sr-only">
              {t("อีเมล", "Email")}
            </label>
            <Input
              id="home-newsletter-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr(null);
              }}
              placeholder={t("ใส่อีเมลของคุณ...", "you@email.com")}
              disabled={pending}
              className="h-11 flex-1 border-white/25 bg-white/95 text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-emerald-300"
            />
            <Button
              type="submit"
              disabled={pending}
              className="h-11 shrink-0 rounded-sm border-2 border-white bg-white px-6 text-sm font-semibold tracking-wide text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                t("สมัครรับข่าว", "Subscribe")
              )}
            </Button>
          </form>
        )}
      </div>
      {err ? (
        <p className="border-t border-white/10 px-6 py-3 text-center text-sm text-red-200 sm:text-left" role="alert">
          {err}
        </p>
      ) : null}
    </section>
  );
}
