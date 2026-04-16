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
    <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-6 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        Newsletter
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Short updates from the editorial desk — no clutter.
      </p>
      {msg ? (
        <p className="mt-4 text-sm text-emerald-700" role="status">
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
            className="min-h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
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
        <p className="mt-3 text-sm text-red-600" role="alert">
          {err}
        </p>
      )}
    </aside>
  );
}
