export type BusinessDocumentFields = {
  recipientName: string;
  brandName: string;
  senderName: string;
  /** ISO date `YYYY-MM-DD` */
  documentDate: string;
};

export type BusinessDocumentDraft = BusinessDocumentFields & {
  /** Full letter text — whitespace & line breaks preserved */
  bodyText: string;
  /** Email / document subject line */
  subject: string;
  /** Optional handwritten / scanned signature image URL */
  signatureImageUrl: string | null;
};

export type BusinessDocumentDispatchInput = BusinessDocumentDraft & {
  recipientEmail: string;
  /** When set, mark this DB row SENT after successful send */
  documentId?: string | null;
};

export type BusinessDocumentStatus = "DRAFT" | "SENT";

export type BusinessDocumentRecord = BusinessDocumentDraft & {
  id: string;
  recipientEmail: string;
  status: BusinessDocumentStatus;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Default subject for the OEM partnership template */
export const BUSINESS_DOCUMENT_SUBJECT =
  "Business Partnership Inquiry & OEM Terms (Smile Seed Bank x Green Future)";

/** site_settings key for default founder signature image */
export const FOUNDER_SIGNATURE_SETTING_KEY = "founder_signature_url";

export const DEFAULT_BUSINESS_DOCUMENT_FIELDS: BusinessDocumentFields = {
  recipientName: "Green Future Team",
  brandName: "Mellow Moon",
  senderName: "[Your Name]",
  documentDate: new Date().toISOString().slice(0, 10),
};
