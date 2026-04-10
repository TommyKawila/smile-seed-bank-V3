import { z } from "zod";

/** JSON/DB may omit the key or use strings; preserve explicit `false`. */
function boolCoerce(defaultWhenMissing: boolean) {
  return z.preprocess((v: unknown) => {
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
    if (v === undefined || v === null) return defaultWhenMissing;
    return Boolean(v);
  }, z.boolean());
}

export const BankAccountSchema = z.object({
  bankName: z.string().min(1, "กรุณาระบุชื่อธนาคาร"),
  accountName: z.string().min(1, "กรุณาระบุชื่อบัญชี"),
  accountNo: z.string().min(1, "กรุณาระบุเลขบัญชี"),
  isActive: boolCoerce(true),
});

export const PromptPaySchema = z.object({
  identifier: z.string(),
  qrUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean().default(true),
  /** Storefront checkout: show COD payment tab when true. */
  codEnabled: z.boolean().optional().default(false),
});

export const CryptoWalletSchema = z.object({
  network: z.string().min(1, "กรุณาระบุเครือข่าย"),
  address: z.string().min(1, "กรุณาระบุที่อยู่"),
  /** Free text / relative URLs allowed — strict .url() was rejecting valid admin input and breaking saves. */
  qrUrl: z.string().optional().default(""),
  isActive: boolCoerce(true),
});

export const PaymentSettingsSchema = z.object({
  bankAccounts: z.array(BankAccountSchema).default([]),
  promptPay: PromptPaySchema.optional().nullable(),
  cryptoWallets: z.array(CryptoWalletSchema).default([]),
  lineId: z.string().default(""),
  messengerUrl: z.union([z.string().url(), z.literal("")]).default(""),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;
export type PromptPay = z.infer<typeof PromptPaySchema>;
export type CryptoWallet = z.infer<typeof CryptoWalletSchema>;
export type PaymentSettingsForm = z.infer<typeof PaymentSettingsSchema>;
