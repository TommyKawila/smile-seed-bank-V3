import { redirect } from "next/navigation";

/**
 * Account dashboard entry: redirects to profile with the requested tab.
 * Navbar: /account?tab=orders (ออเดอร์ของฉัน), /account?tab=profile (ข้อมูลส่วนตัว)
 */
export default function AccountPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const raw = searchParams?.tab;
  const tab =
    raw === "profile" || raw === "coupons" || raw === "membership" ? raw : "orders";
  redirect(`/profile?tab=${tab}`);
}
