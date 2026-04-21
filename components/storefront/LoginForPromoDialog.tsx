"use client";

import Link from "next/link";
import { Loader2, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

interface LoginForPromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onGoogleLogin: () => Promise<void>;
  onLineLogin: () => Promise<void>;
  /** Full login page URL including next= (e.g. email/password). */
  emailLoginHref: string;
  oauthLoading?: "google" | "line" | null;
  t?: (th: string, en: string) => string;
}

export function LoginForPromoDialog({
  open,
  onOpenChange,
  message,
  onGoogleLogin,
  onLineLogin,
  emailLoginHref,
  oauthLoading = null,
  t = (th) => th,
}: LoginForPromoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/25 bg-gradient-to-b from-accent/80 to-white">
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="rounded-full bg-accent p-4">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg text-zinc-800">
              {t("เข้าสู่ระบบเพื่อใช้โค้ดส่วนลด", "Sign in to use this promo")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 leading-relaxed">{message}</p>
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              onClick={() => void onGoogleLogin()}
              disabled={!!oauthLoading}
              className="w-full gap-2 bg-white border-2 border-primary text-primary hover:bg-accent hover:border-primary font-semibold py-6"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {t("ดำเนินการต่อด้วย Google", "Continue with Google")}
            </Button>
            <Button
              type="button"
              onClick={() => void onLineLogin()}
              disabled={!!oauthLoading}
              className="w-full gap-2 bg-[#06C755] py-6 font-semibold text-white hover:bg-[#05b34c]"
            >
              {oauthLoading === "line" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LineIcon />
              )}
              {t("ดำเนินการต่อด้วย LINE", "Continue with LINE")}
            </Button>
            <Button type="button" variant="outline" className="w-full py-6 font-semibold" asChild>
              <Link href={emailLoginHref}>{t("เข้าสู่ระบบด้วยอีเมล", "Sign in with Email")}</Link>
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            {t("หลังเข้าสู่ระบบ โค้ดจะถูกใช้ให้อัตโนมัติเมื่อรองรับ", "After login, your code will be applied when supported.")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
