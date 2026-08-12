export default function GacpLoading() {
  return (
    <div className="min-h-[50vh] bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl animate-pulse space-y-4">
        <div className="h-10 w-3/4 max-w-2xl rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
        <div className="h-4 w-full max-w-lg rounded bg-slate-100" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-36 rounded-xl bg-slate-100" />
          <div className="h-36 rounded-xl bg-slate-100" />
          <div className="h-36 rounded-xl bg-slate-100" />
          <div className="h-36 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
