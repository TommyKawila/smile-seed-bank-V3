import type { ActiveBankAccount } from "@/lib/storefront-payment-shared";
import { LEGAL_ENTITY } from "@/lib/company-legal-identity";
import { STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO } from "@/lib/storefront-payment-shared";

export const TMY_DEPOSIT_PAYEE_TH = "หจก.ทีเอ็มวาย อะโกรเทรด";
export const TMY_DEPOSIT_PAYEE_EN = LEGAL_ENTITY.nameEn;

function hay(s: string | null | undefined): string {
  return (s ?? "").toLowerCase();
}

export function isTmyAgrotradeAccount(account: {
  account_name?: string | null;
  account_number?: string | null;
}): boolean {
  const name = hay(account.account_name);
  const no = String(account.account_number ?? "").replace(/\D/g, "");
  if (no && no === STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO) return true;
  return (
    name.includes("ทีเอ็มวาย") ||
    name.includes("t.m.y") ||
    name.includes("tmy agro") ||
    name.includes("อะโกร")
  );
}

export function pickTmyAgrotradeAccount(
  accounts: ActiveBankAccount[]
): ActiveBankAccount | null {
  return accounts.find((a) => isTmyAgrotradeAccount(a)) ?? accounts[0] ?? null;
}

export type TmyBankPublic = {
  bankName: string;
  accountNo: string;
  accountName: string;
};

export function toTmyBankPublic(account: ActiveBankAccount | null): TmyBankPublic {
  if (!account) {
    return {
      bankName: "",
      accountNo: "",
      accountName: TMY_DEPOSIT_PAYEE_TH,
    };
  }
  return {
    bankName: account.bank_name,
    accountNo: account.account_number,
    accountName: account.account_name?.trim() || TMY_DEPOSIT_PAYEE_TH,
  };
}
