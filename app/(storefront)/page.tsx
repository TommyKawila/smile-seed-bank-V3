import { Suspense } from "react";
import { HomeHeroSkeleton } from "@/components/storefront/HomeHeroSkeleton";
import { HomeHeroLcpHints, HomeMainStream } from "@/app/(storefront)/home-stream";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeHeroLcpHints />
      </Suspense>
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeMainStream />
      </Suspense>
    </>
  );
}
