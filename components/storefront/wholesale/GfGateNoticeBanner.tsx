"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  GF_RFQ_NON_BINDING_EN,
  GF_RFQ_NON_BINDING_TH,
  gfAcceptsPublicDeposits,
  gfGateNotice,
  isGfPreGate,
} from "@/lib/green-future-approved-marketing";

type Props = {
  className?: string;
  showNonBinding?: boolean;
  variant?: "light" | "dark";
};

export function GfGateNoticeBanner({
  className = "",
  showNonBinding = true,
  variant = "light",
}: Props) {
  const { t } = useLanguage();
  const depositsOpen = gfAcceptsPublicDeposits();
  const shell =
    variant === "dark"
      ? "rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 sm:px-5 sm:py-5"
      : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5 sm:py-5";
  const titleCls = variant === "dark" ? "text-sm font-semibold text-amber-100" : "text-sm font-semibold text-amber-950";
  const bodyCls =
    variant === "dark"
      ? "mt-2 text-xs leading-relaxed text-amber-100/90"
      : "mt-2 text-xs leading-relaxed text-amber-900/90";

  return (
    <div className={`${shell} ${className}`}>
      <p className={titleCls}>{gfGateNotice(t)}</p>
      {showNonBinding && depositsOpen ? (
        <p className={bodyCls}>
          {t(
            "ขั้นตอน: 1) สั่งจองบนหน้านี้ 2) โอนมัดจำ 50% เข้า หจก.ทีเอ็มวาย อะโกรเทรด แล้วแนบสลิปที่ /wholesale/transfer — ไม่ใช้ตะกร้าร้าน",
            "Steps: 1) Place the reservation on this page 2) Transfer the 50% deposit to T.M.Y Agro Trade Limited Partnership and attach the slip at /wholesale/transfer — not the shop cart"
          )}
        </p>
      ) : showNonBinding && isGfPreGate() ? (
        <p className={bodyCls}>
          {t(GF_RFQ_NON_BINDING_TH, GF_RFQ_NON_BINDING_EN)}
        </p>
      ) : null}
    </div>
  );
}
