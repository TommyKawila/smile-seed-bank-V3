import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckoutPageClient } from "@/components/storefront/CheckoutPageClient";
import { fetchCheckoutPaymentSettings } from "@/lib/payment-settings-public";

export const dynamic = "force-dynamic";

/** Server-only: payment settings use Supabase server client + strict select in fetchCheckoutPaymentSettings. */
async function CheckoutWithPaymentData() {
  const { settings, error } = await fetchCheckoutPaymentSettings();
  return (
    <CheckoutPageClient paymentSettings={settings} paymentSettingsError={error} />
  );
}

function CheckoutLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="min-h-[24rem] w-full rounded-xl" />
          </div>
        </div>
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
