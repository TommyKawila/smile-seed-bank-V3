"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TraceabilityLotError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center bg-white px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Lot lookup failed</h1>
      <p className="mt-2 text-sm text-slate-600">Please try again.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          className="min-h-12 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => reset()}
        >
          Retry
        </Button>
        <Button asChild variant="outline" className="min-h-12">
          <Link href="/traceability">Traceability</Link>
        </Button>
      </div>
    </div>
  );
}
