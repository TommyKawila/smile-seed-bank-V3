"use client";

import { ClipboardList } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  itemCount: number;
  onOpen: () => void;
};

export function FloatingQuoteBar({ itemCount, onOpen }: Props) {
  const { t } = useLanguage();
  if (itemCount <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 sm:p-6">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto mx-auto flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        <ClipboardList className="h-5 w-5" aria-hidden />
        {t(
          `คำขอใบเสนอราคาของคุณ (${itemCount} รายการ)`,
          `Your Quote Request (${itemCount} items)`
        )}
      </button>
    </div>
  );
}
