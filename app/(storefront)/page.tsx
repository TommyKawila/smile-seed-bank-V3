import { Suspense } from "react";

function HomeMainStreamFallback() {
  return <div className="min-h-[100svh] bg-zinc-50" aria-hidden />;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeHeroLcpHintsBranch />
      </Suspense>
      <Suspense fallback={<HomeMainStreamFallback />}>
        <HomeMainStreamBranch />
      </Suspense>
    </>
  );
}

async function HomeHeroLcpHintsBranch() {
  const { HomeHeroLcpHints } = await import("./home-lcp-hints");
  return <HomeHeroLcpHints />;
}

async function HomeMainStreamBranch() {
  const { HomeMainStream } = await import("./home-stream");
  return <HomeMainStream />;
}
