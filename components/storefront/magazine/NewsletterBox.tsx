"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/app/admin/magazine/actions";
import { useLanguage } from "@/context/LanguageContext";

export function NewsletterBox() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await subscribeToNewsletter(trimmed);
      if (r.ok) {
        setMsg(r.message);
        setEmail("");
        return;
      }
      setErr(r.error);
    });
  }

  return (
    <aside className="rounded-xl border border-border/60 bg-zinc-950/40 px-5 py-6">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {t("จดหมายข่าว", "Newsletter")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {t(
          "สรุปสั้นๆ จากโต๊ะบรรณาธิการ — คัดเฉพาะประเด็นสำคัญ",
          "Short updates from the editorial desk — no clutter."
        )}
      </p>
      {msg ? (
        <p className="mt-4 text-sm text-primary" role="status">
          {msg}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label htmlFor="magazine-newsletter-email" className="sr-only">
            {t("อีเมล", "Email")}
          </label>
          <input
            id="magazine-newsletter-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr(null);
            }}
            placeholder={t("ใส่อีเมลของคุณ...", "you@email.com")}
            disabled={pending}
            className="min-h-10 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500/35"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              t("ติดตาม", "Join")
            )}
          </button>
        </form>
      )}
      {err && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {err}
        </p>
      )}
    </aside>
  );
}
