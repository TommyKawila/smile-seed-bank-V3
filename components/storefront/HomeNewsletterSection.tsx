"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";

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
    <section className="mx-4 mb-14 overflow-hidden rounded-xl border border-border/60 bg-zinc-950/40 sm:mx-6">
      <div className="mx-auto flex max-w-4xl flex-col items-stretch justify-between gap-8 px-6 py-10 sm:flex-row sm:items-center sm:gap-10">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {t("จดหมายข่าว", "Newsletter")}
          </p>
          <h3 className="mt-2 font-sans text-xl font-medium leading-snug text-zinc-100 sm:text-2xl">
            {t(
              "รับส่วนลด 10% สำหรับออเดอร์แรกของคุณ",
              "Get 10% off your first order"
            )}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {t(
              "สมัครรับข่าวสารเพื่อรับโค้ดส่วนลด และเทคนิคการปลูกจากผู้เชี่ยวชาญส่งตรงถึงอีเมลคุณ",
              "Join our newsletter for exclusive growing tips and get your discount code instantly."
            )}
          </p>
        </div>

        {msg ? (
          <p className="text-center text-sm font-medium text-emerald-400/80 sm:text-right" role="status">
            {msg}
          </p>
        ) : (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-shrink-0 sm:flex-row sm:items-stretch"
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
              className="min-h-12 h-12 min-w-0 flex-1 touch-manipulation border-zinc-800 bg-zinc-900/50 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500/35"
            />
            <Button
              type="submit"
              disabled={pending}
              className="min-h-12 h-12 w-full shrink-0 touch-manipulation bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
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
        <p className="border-t border-border/60 px-6 py-3 text-center text-sm text-red-400 sm:text-left" role="alert">
          {err}
        </p>
      ) : null}
    </section>
  );
}
