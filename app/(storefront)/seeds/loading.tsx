export default function SeedsLoading() {
  return (
    <div className="min-h-[60vh] bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-10 w-64 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-card" />
        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
