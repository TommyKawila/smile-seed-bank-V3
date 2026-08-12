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
  /** Optional images embedded in letter / PDF / email (after body, before signature) */
  attachmentImageUrls: string[];
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

/** Blank default — letters are built from raw paste */
export const BUSINESS_DOCUMENT_SUBJECT = "";

/** Used when save/send has an empty subject */
export const BUSINESS_DOCUMENT_FALLBACK_SUBJECT = "(No subject)";

/** site_settings key for default founder signature image */
export const FOUNDER_SIGNATURE_SETTING_KEY = "founder_signature_url";

export const DEFAULT_BUSINESS_DOCUMENT_FIELDS: BusinessDocumentFields = {
  recipientName: "",
  brandName: "",
  senderName: "",
  documentDate: new Date().toISOString().slice(0, 10),
};
