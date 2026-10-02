import type { Metadata } from "next";
import Link from "next/link";
import { DepositTransferForm } from "@/components/storefront/wholesale/DepositTransferForm";
import { gfAcceptsPublicDeposits, gfWholesaleRobots } from "@/lib/green-future-approved-marketing";
import { fetchActiveBankAccounts } from "@/lib/payment-settings-public";
import {
  pickTmyAgrotradeAccount,
  toTmyBankPublic,
} from "@/lib/tmy-deposit-bank";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notify SGF deposit transfer | Smile Seed Bank",
  description:
    "Notify a 50% SGF seed deposit transfer to T.M.Y Agro Trade Limited Partnership and attach the slip.",
  alternates: { canonical: "/wholesale/transfer" },
  robots: gfWholesaleRobots(),
};

export default async function WholesaleTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!gfAcceptsPublicDeposits()) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-slate-700">
        Deposits are not open.
      </div>
    );
  }
  const { accounts } = await fetchActiveBankAccounts();
  const bank = toTmyBankPublic(pickTmyAgrotradeAccount(accounts));

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        SGF Seeds · B2B
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        แจ้งโอนมัดจำ 50%
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        โอนเข้า หจก.ทีเอ็มวาย อะโกรเทรด แล้วแนบสลิป — แยกจากตะกร้าสินค้าปกติ
      </p>
      <p className="mt-1 text-sm">
        <Link href="/wholesale" className="text-emerald-700 underline">
          กลับไปสั่งเมล็ด
        </Link>
      </p>
      <div className="mt-8">
        <DepositTransferForm bank={bank} initialRef={ref?.trim() ?? ""} />
      </div>
    </div>
  );
}
