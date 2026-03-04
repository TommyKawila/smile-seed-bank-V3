import { z } from "zod";

export const BankAccountSchema = z.object({
  bankName: z.string().min(1, "กรุณาระบุชื่อธนาคาร"),
  accountName: z.string().min(1, "กรุณาระบุชื่อบัญชี"),
  accountNo: z.string().min(1, "กรุณาระบุเลขบัญชี"),
  isActive: z.boolean().default(true),
});

export const PromptPaySchema = z.object({
  identifier: z.string(),
  qrUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean().default(true),
});

export const CryptoWalletSchema = z.object({
  network: z.string().min(1, "กรุณาระบุเครือข่าย"),
  address: z.string().min(1, "กรุณาระบุที่อยู่"),
  qrUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean().default(true),
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
