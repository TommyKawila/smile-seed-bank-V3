/** Vertical rule between chip groups in the catalog filter strip. */
export function ShopFilterStripDivider({
  label,
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  if (label) {
    return (
      <span
        className={
          compact
            ? "inline-flex shrink-0 items-center gap-1 px-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground"
            : "inline-flex shrink-0 items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        }
        aria-hidden
      >
        <span className="h-4 w-px bg-muted/40" />
        {label}
        <span className="h-4 w-px bg-muted/40" />
      </span>
    );
  }
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-muted/40 lg:h-6" aria-hidden />;
}
