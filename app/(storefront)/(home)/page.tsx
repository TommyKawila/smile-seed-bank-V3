import { Suspense } from "react";
import { HomeMainStream } from "@/app/(storefront)/home-stream";

function HomeMainStreamFallback() {
  return <div className="min-h-[100svh] bg-muted/30" aria-hidden />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeMainStreamFallback />}>
      <HomeMainStream />
    </Suspense>
  );
}
