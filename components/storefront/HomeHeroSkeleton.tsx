/** Streaming fallbacks — Tailwind only (no CSS modules). */

export function HomeHeroSkeleton() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <section className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-none bg-zinc-50 max-lg:max-h-[100svh] max-lg:w-full lg:max-h-none">
        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:min-h-0 lg:max-h-none lg:grid-cols-2 lg:items-stretch">
          <div className="relative z-10 order-2 -mt-20 flex flex-col justify-end bg-white px-4 pb-5 pt-5 sm:-mt-24 sm:px-8 sm:pb-8 lg:order-1 lg:mt-0 lg:max-w-xl lg:justify-center lg:bg-transparent lg:px-10 lg:py-24 lg:pl-12 lg:pr-10 lg:pb-24 xl:pl-16 xl:pr-14">
            <div className="space-y-4">
              <div className="h-3 w-48 animate-pulse rounded bg-zinc-200" />
              <div className="h-10 w-full max-w-md animate-pulse rounded bg-zinc-200" />
              <div className="h-16 w-full max-w-md animate-pulse rounded bg-zinc-100" />
              <div className="flex gap-3 pt-2">
                <div className="h-11 w-40 animate-pulse rounded-sm bg-zinc-200" />
                <div className="h-11 w-40 animate-pulse rounded-sm bg-zinc-100" />
              </div>
            </div>
          </div>
          <div className="relative order-1 w-full shrink-0 overflow-hidden bg-zinc-200 aspect-[392/429] lg:order-2 lg:aspect-[617/712] lg:h-auto lg:min-h-0">
            <div className="absolute inset-0 animate-pulse bg-zinc-200" aria-hidden />
          </div>
        </div>
      </section>
      <div className="h-24 animate-pulse bg-white" aria-hidden />
    </div>
  );
}

export function HomeHeroCarouselSkeleton() {
  return (
    <div className="relative h-full min-h-0 w-full animate-pulse bg-zinc-200" aria-hidden />
  );
}
