import { redirect } from "next/navigation";
import { BadgeCheck, Gift, Leaf, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderHistoryList } from "@/components/storefront/OrderHistoryList";
import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/timeout";
import {
  getCustomerOrders,
  getCustomerProfile,
  type CustomerOrderSummary,
  type CustomerProfile,
} from "@/services/customer-service";

const NEXT_REWARD_POINTS = 100;

function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function loyaltyProgress(points: number): number {
  return Math.min(100, Math.max(0, (points / NEXT_REWARD_POINTS) * 100));
}

function LoyaltyScorecard({ profile }: { profile: CustomerProfile }) {
  const progress = loyaltyProgress(profile.currentLoyaltyPoints);
  const remaining = Math.max(0, NEXT_REWARD_POINTS - profile.currentLoyaltyPoints);

  return (
    <Card className="min-h-[260px] overflow-hidden border-primary/15 bg-primary text-primary-foreground shadow-sm">
      <CardContent className="relative p-6 sm:p-7">
        <div className="absolute right-4 top-4 rounded-full bg-white/10 p-3" aria-hidden>
          <Leaf className="h-6 w-6" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
          Loyalty Scorecard
        </p>
        <h1 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          {profile.fullName ?? "Smile Member"}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          100 THB = 1 point. Redeem points as discount on eligible orders.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-white/60">Current points</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{profile.currentLoyaltyPoints}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Lifetime spend</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{formatBaht(profile.lifetimeSpend)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Status</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              <BadgeCheck className="h-4 w-4" />
              {profile.isWholesale ? "Wholesale" : "Retail"}
            </p>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between text-xs text-white/70">
            <span>Next reward</span>
            <span>{remaining === 0 ? "Reward ready" : `${remaining} pts to go`}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileMiniCard({ profile }: { profile: CustomerProfile }) {
  return (
    <Card className="min-h-[260px] border-zinc-200/80 shadow-sm">
      <CardContent className="p-6 sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <User className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-zinc-900">Account Details</h2>
        <div className="mt-4 space-y-3 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-zinc-500">Email</span>
            <span className="text-right font-medium text-zinc-900">{profile.email ?? "-"}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-zinc-500">Phone</span>
            <span className="text-right font-medium text-zinc-900">{profile.phone ?? "-"}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-zinc-500">LINE alerts</span>
            <span className="text-right font-medium text-zinc-900">
              {profile.lineUserId ? "Connected" : "Not connected"}
            </span>
          </p>
        </div>
        <a
          href="/profile?tab=profile"
          className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Edit profile
        </a>
      </CardContent>
    </Card>
  );
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getCustomerProfile(user.id);
  const safeProfile: CustomerProfile =
    profile ?? {
      id: user.id,
      fullName: user.user_metadata?.full_name as string | null | undefined ?? null,
      email: user.email ?? null,
      phone: null,
      address: null,
      lineUserId: null,
      isWholesale: false,
      currentLoyaltyPoints: 0,
      lifetimeSpend: 0,
    };

  const orders = await withTimeout<CustomerOrderSummary[]>(
    getCustomerOrders(user.id),
    2000,
    []
  );

  return (
    <main className="min-h-screen bg-white px-4 pb-16 pt-24 text-zinc-900 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Gift className="h-3.5 w-3.5" />
            Smile Member Portal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your Account</h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Track loyalty points, order status, shipping updates, and free-shipping progress in one place.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <LoyaltyScorecard profile={safeProfile} />
          <ProfileMiniCard profile={safeProfile} />
        </div>

        <OrderHistoryList orders={orders} />
      </div>
    </main>
  );
}
