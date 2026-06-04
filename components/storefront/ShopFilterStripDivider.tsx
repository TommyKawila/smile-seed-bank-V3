/** Vertical rule between chip groups in the catalog filter strip. */
export function ShopFilterStripDivider({ label }: { label?: string }) {
  if (label) {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
        aria-hidden
      >
        <span className="h-4 w-px bg-zinc-200" />
        {label}
        <span className="h-4 w-px bg-zinc-200" />
      </span>
    );
  }
  return <span className="mx-0.5 h-6 w-px shrink-0 bg-zinc-200" aria-hidden />;
}
