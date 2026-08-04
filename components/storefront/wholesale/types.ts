import type { B2BCurrency } from "@/types/b2b-quote";

export type QuoteCartLine = {
  strainId: string;
  name: string;
  quantity: number;
};

export type WholesalePaymentMethod = "THB_BANK" | "EUR_WIRE" | "USDT";

export type RfqFormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: WholesalePaymentMethod;
  requireGacp: boolean;
  message: string;
};

export type WholesaleCurrency = B2BCurrency;
