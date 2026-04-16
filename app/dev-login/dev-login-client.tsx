"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DevLoginClient() {
  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-amber-500/30 bg-zinc-950 p-8 shadow-xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Development only
        </p>
        <h1 className="mt-2 text-xl font-bold text-white">Local admin access</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Middleware skips admin auth when{" "}
          <code className="rounded bg-zinc-800 px-1">NODE_ENV=development</code>. Open the
          dashboard directly, or POST to establish a Supabase session (cookies) using{" "}
          <code className="rounded bg-zinc-800 px-1">DEV_ADMIN_EMAIL</code> /{" "}
          <code className="rounded bg-zinc-800 px-1">DEV_ADMIN_PASSWORD</code>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full bg-emerald-700 text-white hover:bg-emerald-600"
        >
          <Link href="/admin/dashboard">Open /admin/dashboard (no session)</Link>
        </Button>

        <form action="/api/dev/sign-in" method="POST">
          <Button
            type="submit"
            variant="outline"
            className="w-full border-amber-500/40 text-amber-100 hover:bg-zinc-800"
          >
            Force login as admin
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-500">
        This route 404s in production. Dev bypass never runs when{" "}
        <code className="rounded bg-zinc-800 px-1">NODE_ENV=production</code>.
      </p>
    </div>
  );
}
