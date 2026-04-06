"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/app/admin/magazine/actions";

export function NewsletterBox() {
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
    <aside className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 px-5 py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
        Newsletter
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Short updates from the editorial desk — no clutter.
      </p>
      {msg ? (
        <p className="mt-4 text-sm text-emerald-400/95" role="status">
          {msg}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label htmlFor="magazine-newsletter-email" className="sr-only">
            Email
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
            placeholder="you@email.com"
            disabled={pending}
            className="min-h-10 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-600/40 focus:outline-none focus:ring-1 focus:ring-emerald-600/25"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-emerald-800/90 px-5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              "Join"
            )}
          </button>
        </form>
      )}
      {err && (
        <p className="mt-3 text-sm text-red-400/90" role="alert">
          {err}
        </p>
      )}
    </aside>
  );
}
