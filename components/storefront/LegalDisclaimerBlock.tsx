"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getStorefrontLegalDisclaimer } from "@/lib/storefront-legal-disclaimer";
import { cn } from "@/lib/utils";

type LegalDisclaimerBlockProps = {
  className?: string;
  headingId?: string;
};

export function LegalDisclaimerBlock({
  className,
  headingId = "legal-disclaimer-heading",
}: LegalDisclaimerBlockProps) {
  const { locale } = useLanguage();
  const { title, body } = getStorefrontLegalDisclaimer(locale);

  return (
    <aside
      role="note"
      aria-labelledby={headingId}
      className={cn(
        "rounded-xl border border-border/70 bg-muted/15 p-4 sm:p-5",
        className
      )}
    >
      <p
        id={headingId}
        className="text-xs font-semibold uppercase tracking-wider text-foreground/85"
      >
        {title}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-foreground/75 sm:text-sm">{body}</p>
    </aside>
  );
}
