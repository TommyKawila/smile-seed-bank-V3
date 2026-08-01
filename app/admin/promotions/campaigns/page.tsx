import { redirect } from "next/navigation";

/** Popup campaigns retired — keep URL for old bookmarks. */
export default function AdminPromotionCampaignsRetiredRedirect() {
  redirect("/admin/discounts");
}
