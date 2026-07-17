import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileOrdersForCustomer } from "@/services/profile-orders-service";
import { ProfilePageClient } from "@/app/(storefront)/profile/ProfilePageClient";
import type { Customer } from "@/types/supabase";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: customerRow }, initialOrders] = await Promise.all([
    supabase.from("customers").select("*").eq("id", user.id).maybeSingle(),
    getProfileOrdersForCustomer(user.id).catch(() => []),
  ]);

  return (
    <ProfilePageClient
      serverUserId={user.id}
      serverUserEmail={user.email ?? null}
      initialCustomer={(customerRow as Customer | null) ?? null}
      initialOrders={initialOrders}
    />
  );
}
