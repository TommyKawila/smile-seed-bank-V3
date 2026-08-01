import { redirect } from "next/navigation";

/** Brand checkout promos retired — keep URL for old bookmarks. */
export default function AdminBrandPromotionsRetiredRedirect() {
  redirect("/admin/discounts");
}
