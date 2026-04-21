"use client";

import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { getLineOaMessageIdForPrefill, lineMeAddFriendUrl } from "@/lib/line-oa-url";

const LINE_BTN =
  "flex w-full items-center justify-center rounded-xl bg-[#06C755] font-bold text-white shadow-md transition-opacity hover:opacity-[0.96] active:opacity-90";

type LineOaResponsiveCtaProps = {
  href: string;
  orderNumber: string;
  className?: string;
  children: React.ReactNode;
  /** Desktop: add-friend page; mobile: prefilled chat (`href`). Parcel/cancelled flows omit this so both use `href`. */
  desktopAddFriend?: boolean;
  lineId?: string | null;
};

export function LineOaResponsiveCta({
  href,
  orderNumber,
  className,
  children,
  desktopAddFriend = false,
  lineId = null,
}: LineOaResponsiveCtaProps) {
  const { t } = useLanguage();
  const merged = cn(LINE_BTN, className);
  const desktopHref = desktopAddFriend
    ? lineMeAddFriendUrl(lineId ?? getLineOaMessageIdForPrefill())
    : href;

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(merged, "md:hidden")}
        aria-label={t(
          `เปิด LINE พร้อมข้อความออเดอร์ #${orderNumber}`,
          `Open LINE with order #${orderNumber} prefilled`,
        )}
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        {children}
      </a>
      <a
        href={desktopHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(merged, "hidden md:flex")}
        aria-label={t(
          desktopAddFriend ? "เพิ่มเพื่อน LINE ร้านเรา" : `เปิด LINE — ออเดอร์ #${orderNumber}`,
          desktopAddFriend ? "Add our LINE Official Account" : `Open LINE — order #${orderNumber}`,
        )}
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        {children}
      </a>
    </>
  );
}
