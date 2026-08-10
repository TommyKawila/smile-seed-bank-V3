"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, Mail, Lock, User, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { getURL } from "@/lib/get-url";
import { safeNextPath } from "@/lib/safe-redirect-path";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { LineInAppGoogleOverlay } from "@/components/storefront/LineInAppGoogleOverlay";
import { isLineInAppUserAgent } from "@/lib/line-in-app-browser";
import { cn } from "@/lib/utils";

const fieldLabelClass = "text-xs font-medium text-zinc-500";
const inputClass =
  "border-zinc-800 bg-zinc-900/50 pl-9 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500/40";

function nextParamFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [collectCouponHint, setCollectCouponHint] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lineGoogleOverlayOpen, setLineGoogleOverlayOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLineInAppUserAgent(navigator.userAgent)) setLineGoogleOverlayOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("reason") === "collect_coupon") {
      setCollectCouponHint(true);
      sp.delete("reason");
      const q = sp.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`,
      );
    }
    const e = sp.get("email");
    if (e) setEmail(decodeURIComponent(e));
    if (sp.get("reset") === "success") {
      setSuccess(
        t(
          "อัปเดตรหัสผ่านแล้ว — เข้าสู่ระบบด้วยรหัสใหม่",
          "Password updated. Sign in with your new password.",
        ),
      );
    }
    const err = sp.get("error");
    if (err === "access_denied") {
      setError(
        t(
          "เซสชันไม่ถูกต้อง — ขอลิงก์รีเซ็ตใหม่จากอีเมล",
          "Invalid session. Request a new reset link from your email.",
        ),
      );
    } else if (err === "no_session") {
      setError(t("ลิงก์หมดอายุหรือไม่ถูกต้อง", "Invalid or expired link."));
    } else if (err === "recovery_link") {
      setError(t("ไม่สามารถยืนยันลิงก์รีเซ็ตได้", "Could not verify reset link."));
    }
  }, [t]);

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("กรอกอีเมลก่อน แล้วกดลืมรหัสผ่าน", "Enter your email, then tap Forgot password."));
      return;
    }
    setResetSending(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/update-password")}`,
      });
      if (err) throw new Error(err.message);
      setSuccess(
        t("ส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว — ตรวจสอบกล่องจดหมาย", "Check your email for the reset link."),
      );
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setResetSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message);
        router.push(nextParamFromWindow() ?? "/profile");
        router.refresh();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (err) throw new Error(err.message);
        setSuccess(t("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี", "Sign up successful! Check your email to confirm your account."));
      }
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setIsLoading(false);
    }
  };

  const oauthRedirectTo = () => {
    const next = nextParamFromWindow();
    const callbackBase = `${getURL()}auth/callback`;
    return next ? `${callbackBase}?next=${encodeURIComponent(next)}` : callbackBase;
  };

  const handleGoogle = async () => {
    if (typeof navigator !== "undefined" && isLineInAppUserAgent(navigator.userAgent)) {
      setLineGoogleOverlayOpen(true);
      return;
    }
    setGoogleLoading(true);
    const redirectTo = oauthRedirectTo();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleLine = async () => {
    setLineLoading(true);
    try {
      const next = nextParamFromWindow();
      const callbackUrl = `/auth/line-bridge${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      await nextAuthSignIn("line", { callbackUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLineLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)]"
        aria-hidden
      />
      <LineInAppGoogleOverlay open={lineGoogleOverlayOpen} onOpenChange={setLineGoogleOverlayOpen} />
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-zinc-950/40">
          <div className="px-6 pb-5 pt-8 text-center sm:px-7 sm:pt-9">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              {t("เริ่มต้นการสั่งซื้อ", "Start your order")}
            </h1>
            {collectCouponHint ? (
              <p className="mx-auto mt-3 max-w-sm rounded-lg border border-emerald-500/25 bg-transparent px-3 py-2 text-xs font-medium text-emerald-400/80">
                {t(
                  "กรุณาเข้าสู่ระบบเพื่อบันทึกส่วนลดไปที่โปรไฟล์ของคุณ",
                  "Please log in to save this discount to your profile.",
                )}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 border-y border-border/60 px-4 py-3">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                  mode === m
                    ? "border-zinc-600 bg-zinc-800/80 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
                )}
              >
                {m === "login" ? t("เข้าสู่ระบบ", "Sign In") : t("สมัครสมาชิก", "Register")}
              </button>
            ))}
          </div>

          <div className="space-y-5 px-6 pb-8 pt-5 sm:px-7 sm:pb-9">
            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2.5 border-zinc-700 bg-zinc-900/50 font-semibold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/70 hover:text-zinc-100"
                onClick={handleGoogle}
                disabled={googleLoading || lineLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Google
              </Button>

              <Button
                type="button"
                className="h-11 w-full gap-2.5 bg-[#06C755] font-semibold text-white hover:bg-[#05b34c]"
                onClick={handleLine}
                disabled={googleLoading || lineLoading}
              >
                {lineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                LINE
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-border/60" />
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {t("หรือ", "or")}
              </span>
              <Separator className="flex-1 bg-border/60" />
            </div>

            <Button
              asChild
              variant="outline"
              className="h-11 w-full gap-2 border border-zinc-800 bg-zinc-900/50 font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100"
            >
              <Link href="/checkout" className="flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0 text-zinc-400" />
                {t("สั่งซื้อทันที (Guest)", "Guest checkout")}
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-border/60" />
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {t("หรือ", "or")}
              </span>
              <Separator className="flex-1 bg-border/60" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence>
                {mode === "register" && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <Label className={fieldLabelClass}>{t("ชื่อ-นามสกุล", "Full Name")}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t("ชื่อ-นามสกุล", "Full name")}
                          className={inputClass}
                          required={mode === "register"}
                        />
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>{t("อีเมล", "Email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className={fieldLabelClass}>{t("รหัสผ่าน", "Password")}</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => void handleForgotPassword()}
                      disabled={resetSending}
                      className="text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline disabled:opacity-50"
                    >
                      {resetSending ? t("กำลังส่ง…", "Sending…") : t("ลืมรหัสผ่าน?", "Forgot password?")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(inputClass, "pr-10")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/25 bg-transparent px-3 py-2 text-xs font-medium text-red-400">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-lg border border-emerald-500/25 bg-transparent px-3 py-2 text-xs font-medium text-emerald-400">
                  {success}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full gap-2 bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login"
                  ? t("เข้าสู่ระบบ", "Sign in")
                  : t("สมัครสมาชิก", "Register")}
              </Button>
            </form>

            <p className="pt-1 text-center text-[11px] leading-relaxed text-zinc-600">
              {t("โดยการสมัครสมาชิก คุณยอมรับ", "By signing up you agree to our")}{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
              >
                {t("เงื่อนไขการใช้งาน", "Terms of Service")}
              </Link>
            </p>
          </div>
        </div>
      </m.div>
    </div>
  );
}
