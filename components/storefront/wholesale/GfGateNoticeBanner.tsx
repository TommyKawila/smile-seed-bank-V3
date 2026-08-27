"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  GF_RFQ_NON_BINDING_EN,
  GF_RFQ_NON_BINDING_TH,
  gfGateNotice,
  isGfPreGate,
} from "@/lib/green-future-approved-marketing";

type Props = {
  className?: string;
  showNonBinding?: boolean;
};

export function GfGateNoticeBanner({
  className = "",
  showNonBinding = true,
}: Props) {
  const { t } = useLanguage();

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5 sm:py-5 ${className}`}
    >
      <p className="text-sm font-semibold text-amber-950">{gfGateNotice(t)}</p>
      {showNonBinding && isGfPreGate() ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-900/90">
          {t(GF_RFQ_NON_BINDING_TH, GF_RFQ_NON_BINDING_EN)}
        </p>
      ) : null}
    </div>
  );
}
