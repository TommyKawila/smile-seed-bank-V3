import { redirect } from "next/navigation";

/** Legacy hub — brand/popup promo UIs retired; coupons live under discounts. */
export default function AdminPromotionsLegacyRedirect() {
  redirect("/admin/discounts");
}
