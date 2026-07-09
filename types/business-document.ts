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
};

export type BusinessDocumentDispatchInput = BusinessDocumentDraft & {
  recipientEmail: string;
};

export const BUSINESS_DOCUMENT_SUBJECT =
  "Business Partnership Inquiry & OEM Terms (Smile Seed Bank x Green Future)";

export const DEFAULT_BUSINESS_DOCUMENT_FIELDS: BusinessDocumentFields = {
  recipientName: "Green Future Team",
  brandName: "Mellow Moon",
  senderName: "[Your Name]",
  documentDate: new Date().toISOString().slice(0, 10),
};
