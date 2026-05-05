import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckoutPageClient } from "@/components/storefront/CheckoutPageClient";
import { fetchCheckoutPaymentSettings } from "@/lib/payment-settings-public";

export const dynamic = "force-dynamic";

/** Server-only: loads payment instructions via Postgres (guest-safe, not Supabase anon RLS). */
async function CheckoutWithPaymentData() {
  const { settings, error } = await fetchCheckoutPaymentSettings();
  return (
    <CheckoutPageClient
      paymentSettings={settings}
      paymentSettingsError={error}
    />
  );
}

function CheckoutLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoadingSkeleton />}>
      <CheckoutWithPaymentData />
    </Suspense>
  );
}
