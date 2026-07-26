export default function NewSeedsLoading() {
  return (
    <div className="min-h-[60vh] bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-56 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/70" />
        <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
