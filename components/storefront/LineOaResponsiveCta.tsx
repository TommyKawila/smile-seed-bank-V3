"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const LINE_BTN =
  "flex w-full items-center justify-center rounded-xl bg-[#06C755] font-bold text-white shadow-md transition-opacity hover:opacity-[0.96] active:opacity-90";

type LineOaResponsiveCtaProps = {
  href: string;
  orderNumber: string;
  className?: string;
  children: React.ReactNode;
};

export function LineOaResponsiveCta({ href, orderNumber, className, children }: LineOaResponsiveCtaProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !href) return;
    let cancelled = false;
    QRCode.toDataURL(href, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, href]);

  const copyOrderId = () => {
    void navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const merged = cn(LINE_BTN, className);

  return (
    <>
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(merged, "md:hidden")}>
        <MessageCircle className="h-5 w-5 shrink-0" />
        {children}
      </a>
      <button type="button" className={cn(merged, "hidden md:flex")} onClick={() => setOpen(true)}>
        <MessageCircle className="h-5 w-5 shrink-0" />
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,24rem)] gap-4 border-zinc-200 p-5 sm:p-6">
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-base font-semibold text-primary">
              {t("เพิ่มเพื่อน LINE ร้านเรา", "Add our LINE Official Account")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-600">
              {t(
                `สแกน QR นี้ด้วยมือถือเพื่อรับการแจ้งเตือนสถานะพัสดุสำหรับออเดอร์ #${orderNumber}`,
                `Scan this QR code with your phone to receive tracking updates for Order #${orderNumber}.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-3 shadow-inner ring-2 ring-zinc-100">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt=""
                  width={280}
                  height={280}
                  className="size-[min(72vw,280px)] max-h-[280px] max-w-[280px]"
                />
              ) : (
                <div
                  className="flex size-[min(72vw,280px)] max-h-[280px] max-w-[280px] items-center justify-center bg-zinc-50 text-xs text-zinc-400"
                  aria-hidden
                >
                  …
                </div>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full border-zinc-200" onClick={copyOrderId}>
              {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
              {t("คัดลอกเลขออเดอร์", "Copy order ID")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
