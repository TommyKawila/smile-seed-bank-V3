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
  licenseStatus: "active" | "pending" | "";
  licenseNumber: string;
  message: string;
};

export type WholesaleCurrency = "THB" | "EUR";
