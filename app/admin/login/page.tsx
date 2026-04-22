"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-redirect-path";

function nextParam(): string | null {
  if (typeof window === "undefined") return null;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("reason") === "admin_required") {
      setError("ต้องใช้บัญชีแอดมิน / Admin access required.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sb = createClient();
    void (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (cancelled || !user) return;
      if (user.user_metadata?.role === "ADMIN") {
        router.replace(nextParam() ?? "/admin/dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      const role = data.user?.user_metadata?.role;
      if (role !== "ADMIN") {
        await supabase.auth.signOut();
        setError("บัญชีนี้ไม่มีสิทธิ์แอดมิน / This account is not an admin.");
        return;
      }
      router.refresh();
      const dest = nextParam() ?? "/admin/dashboard";
      router.replace(dest);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm">
        <h1 className="font-serif text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          อีเมลและรหัสผ่าน — สำหรับเบราว์เซอร์ที่ไม่รองรับ Google/LINE
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-zinc-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-zinc-700 bg-zinc-950 pl-10 text-base text-white placeholder:text-zinc-600"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="admin-password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-zinc-700 bg-zinc-950 py-2 pl-10 pr-12 text-base text-white placeholder:text-zinc-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-emerald-700 text-base font-medium text-white hover:bg-emerald-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/login" className="text-emerald-500/90 underline-offset-2 hover:underline">
            Storefront login
          </Link>
        </p>
      </div>
    </div>
  );
}
