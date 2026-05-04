"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining, type TimeRemaining } from "@/lib/product-utils";
import { cn } from "@/lib/utils";

const URGENCY_WINDOW_MS = 48 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function DiscountCountdown({
  endsAt,
  locale,
  className,
}: {
  endsAt: string | null | undefined;
  locale: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<TimeRemaining | null>(() =>
    endsAt ? getTimeRemaining(new Date(endsAt)) : null
  );

  useEffect(() => {
    if (!endsAt) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(getTimeRemaining(new Date(endsAt)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (!remaining || remaining.totalMs > URGENCY_WINDOW_MS) return null;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-semibold tabular-nums text-amber-800",
        className
      )}
    >
      {locale === "th" ? "สิ้นสุดใน" : "Ends in"} {pad(remaining.hours)}:
      {pad(remaining.minutes)}:{pad(remaining.seconds)}
    </span>
  );
}
