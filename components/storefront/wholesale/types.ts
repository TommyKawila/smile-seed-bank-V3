import type { B2BCurrency } from "@/types/b2b-quote";
import type { CoaMode } from "@/lib/wholesale-bulk-pricing";

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
  /** @deprecated Prefer coaMode */
  requireGacp?: boolean;
  coaMode: CoaMode;
  buyExtraCoa: boolean;
  coaPackageA: number;
  coaPackageB: number;
  message: string;
};

export type WholesaleCurrency = B2BCurrency;
