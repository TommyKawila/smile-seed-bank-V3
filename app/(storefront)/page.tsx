import { Suspense } from "react";
import { HomeHeroLcpHints } from "@/app/(storefront)/home-lcp-hints";
import { HomeMainStream } from "@/app/(storefront)/home-stream";

function HomeMainStreamFallback() {
  return <div className="min-h-[100svh] bg-zinc-50" aria-hidden />;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeHeroLcpHints />
      </Suspense>
      <Suspense fallback={<HomeMainStreamFallback />}>
        <HomeMainStream />
      </Suspense>
    </>
  );
}
