import { SeedClaimFormClient } from "@/components/storefront/claim/SeedClaimFormClient";

export const metadata = {
  title: "Seed Claim · Smile Seed Bank",
  description: "Seed viability claim form for SGF SEEDS wholesale programme",
  robots: { index: false, follow: false },
};

export default function SeedClaimPage() {
  return <SeedClaimFormClient />;
}
