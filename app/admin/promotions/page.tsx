import { redirect } from "next/navigation";

/** Legacy `/admin/promotions` (bulk + promotion_rules) removed — brand checkout promos live under `/admin/promotions/brands`. */
export default function AdminPromotionsLegacyRedirect() {
  redirect("/admin/promotions/brands");
}
