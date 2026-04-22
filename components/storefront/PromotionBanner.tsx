"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { savePromotionToUser } from "@/app/actions/promotion-campaign-actions";
import { mergeGuestSavedPromotion } from "@/lib/saved-promotion-local";

type CampaignPayload = {
  id: string;
  name: string;
  image_url_desktop: string;
  image_url_mobile: string;
  image_width: number | null;
  image_height: number | null;
  target_url: string;
  save_to_profile?: boolean;
  display_delay_ms: number;
  display_mode: "POPUP" | "EASTER_EGG";
  probability: number;
  promo_code: string;
  discount_type: string;
  discount_value: string;
};

function isSaveActionUrl(target: string | undefined): boolean {
  return target?.trim().toLowerCase() === "action:save";
}

const SEEN_KEY = "ssb_promo_sess_";

function shouldShowSession(campaignId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !sessionStorage.getItem(SEEN_KEY + campaignId);
  } catch {
    return true;
  }
}

function dismissSession(campaignId: string) {
  try {
    sessionStorage.setItem(SEEN_KEY + campaignId, "1");
  } catch {
    /* ignore */
  }
}

function useIsMobile(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setM(mq.matches);
    const fn = () => setM(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
}

export function PromotionBanner() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [campaign, setCampaign] = useState<CampaignPayload | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pathname) return;
    setCampaign(null);
    setOpen(false);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const res = await fetch(
          `/api/storefront/promotion-campaigns?path=${encodeURIComponent(pathname)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as CampaignPayload[];
        if (!Array.isArray(data) || data.length === 0) return;
        const first = data[0];
        if (!first?.id) return;
        const p = typeof first.probability === "number" ? first.probability : 1;
        if (p <= 0) return;
        if (Math.random() >= p) return;
        const delay = Math.max(0, first.display_delay_ms ?? 3000);
        timer = setTimeout(() => {
          if (cancelled) return;
          if (!shouldShowSession(first.id)) return;
          setCampaign(first);
          setOpen(true);
        }, delay);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  if (!campaign) return null;

  const imgSrc =
    isMobile && campaign.image_url_mobile?.trim()
      ? campaign.image_url_mobile
      : campaign.image_url_desktop;
  const w = campaign.image_width ?? 720;
  const h = campaign.image_height ?? 400;
  const isEgg = campaign.display_mode === "EASTER_EGG";
  const rawTarget = campaign.target_url?.trim() ?? "";
  const httpLink = /^https?:\/\//i.test(rawTarget) ? rawTarget : null;
  const saveMode = !!campaign.save_to_profile || isSaveActionUrl(campaign.target_url);
  const bannerInteractive = saveMode || !!httpLink;

  const runBannerClick = async () => {
    dismissSession(campaign.id);
    setOpen(false);
    if (saveMode) {
      const res = await savePromotionToUser(campaign.id);
      if (!res.ok) {
        toast.error(res.error);
      } else if (res.savedToProfile) {
        toast.success("บันทึกโค้ดลงโปรไฟล์ของคุณแล้ว!");
      } else {
        mergeGuestSavedPromotion({
          campaignId: campaign.id,
          promo_code: campaign.promo_code,
          name: campaign.name,
          discount_type: campaign.discount_type,
          discount_value: campaign.discount_value,
        });
        toast.success("บันทึกโค้ดแล้ว", { description: res.guestHint });
      }
    }
    if (httpLink) {
      window.open(httpLink, "_blank", "noopener,noreferrer");
    }
  };

  const imageBlock = (
    <div
      className={cn(
        "relative w-full bg-transparent",
        bannerInteractive && "cursor-pointer"
      )}
      style={{ aspectRatio: `${w} / ${h}` }}
      onClick={() => {
        if (bannerInteractive) void runBannerClick();
      }}
      role={bannerInteractive ? "button" : undefined}
      tabIndex={bannerInteractive ? 0 : undefined}
      onKeyDown={
        bannerInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void runBannerClick();
              }
            }
          : undefined
      }
    >
      <Image
        src={imgSrc}
        alt={campaign.name}
        fill
        className="object-contain"
        sizes="(max-width: 640px) 100vw, 512px"
        unoptimized
        priority
      />
    </div>
  );

  const footer = (
    <div className="space-y-2 border-t border-zinc-100 bg-white p-4">
      <p className="text-sm font-medium text-zinc-800">{campaign.name}</p>
      <p className="text-xs text-zinc-500">
        โค้ด:{" "}
        <span className="font-mono font-semibold text-primary">{campaign.promo_code}</span>
        {" · "}
        {String(campaign.discount_type).toUpperCase() === "PERCENTAGE"
          ? `ลด ${campaign.discount_value}%`
          : `ลด ฿${Number(campaign.discount_value).toLocaleString("th-TH")}`}
      </p>
      {saveMode && httpLink ? (
        <p className="text-[11px] text-zinc-400">คลิกรูปเพื่อบันทึกโค้ดและเปิดลิงก์</p>
      ) : saveMode ? (
        <p className="text-[11px] text-zinc-400">คลิกรูปเพื่อบันทึกโค้ดลงโปรไฟล์</p>
      ) : httpLink ? (
        <p className="text-[11px] text-zinc-400">คลิกรูปเพื่อเปิดลิงก์</p>
      ) : null}
      <Button
        type="button"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => {
          dismissSession(campaign.id);
          setOpen(false);
        }}
      >
        รับทราบ
      </Button>
    </div>
  );

  if (!open) return null;

  if (isEgg) {
    return (
      <div
        className="fixed bottom-6 right-4 z-[100] w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border-0 bg-transparent shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-egg-title"
      >
        <button
          type="button"
          className="absolute right-2 top-2 z-20 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          aria-label="Close"
          onClick={() => {
            dismissSession(campaign.id);
            setOpen(false);
          }}
        >
          <X className="h-4 w-4" />
        </button>
        <h2 id="promo-egg-title" className="sr-only">
          {campaign.name}
        </h2>
        {imageBlock}
        {footer}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) dismissSession(campaign.id);
      }}
    >
      <DialogContent className="max-w-lg border-0 bg-transparent p-0 shadow-none gap-0 overflow-visible sm:max-w-lg [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{campaign.name}</DialogTitle>
        </DialogHeader>
        <button
          type="button"
          className="absolute right-2 top-2 z-20 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          aria-label="Close"
          onClick={() => {
            dismissSession(campaign.id);
            setOpen(false);
          }}
        >
          <X className="h-4 w-4" />
        </button>
        {imageBlock}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
