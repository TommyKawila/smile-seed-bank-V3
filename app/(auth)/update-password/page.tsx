"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JetBrains_Mono } from "next/font/google";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const mono = JetBrains_Mono({ subsets: ["latin"] });

const MIN_LEN = 8;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/login?error=access_denied");
        return;
      }
      setReady(true);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LEN) {
      setError(`Use at least ${MIN_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      await supabase.auth.signOut();
      router.replace("/login?reset=success");
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-800/70" />
        <p className={cn("text-sm text-zinc-500", mono.className)}>VERIFYING_SESSION…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <header className="mb-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-400">
          Genetic Vault
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-zinc-500">ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="np" className="text-zinc-700">
            New password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="np"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-zinc-200 pl-9"
              placeholder={`At least ${MIN_LEN} characters`}
              required
              minLength={MIN_LEN}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp" className="text-zinc-700">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="cp"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="border-zinc-200 pl-9"
              placeholder="Repeat password"
              required
              minLength={MIN_LEN}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="text-xs text-emerald-800/80 underline-offset-2 hover:underline"
        >
          {showPw ? "Hide" : "Show"} passwords
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full bg-emerald-800 text-white hover:bg-emerald-800/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}
