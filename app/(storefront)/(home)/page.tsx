import { Suspense } from "react";
import { HomeMainStream } from "@/app/(storefront)/home-stream";

function HomeMainStreamFallback() {
  return <div className="min-h-[100svh] bg-zinc-50" aria-hidden />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeMainStreamFallback />}>
      <HomeMainStream />
    </Suspense>
  );
}
