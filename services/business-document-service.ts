import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";
import { buildBusinessDocumentPlainText } from "@/lib/business-document-template";
import { buildBusinessDocumentEmailHtml } from "@/lib/email-business-document-html";
import {
  BUSINESS_DOCUMENT_SUBJECT,
  FOUNDER_SIGNATURE_SETTING_KEY,
} from "@/types/business-document";
import type {
  BusinessDocumentDispatchInput,
  BusinessDocumentDraft,
  BusinessDocumentRecord,
  BusinessDocumentStatus,
} from "@/types/business-document";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Smile Seed Bank <orders@smileseedbank.com>";

export type BusinessDocumentSendResult = {
  success: boolean;
  error: string | null;
  documentId?: string;
};

function toRecord(row: {
  id: bigint;
  subject: string;
  body_text: string;
  recipient_name: string;
  recipient_email: string;
  brand_name: string;
  sender_name: string;
  document_date: string;
  signature_image_url: string | null;
  status: string;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): BusinessDocumentRecord {
  return {
    id: String(row.id),
    subject: row.subject,
    bodyText: row.body_text,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    brandName: row.brand_name,
    senderName: row.sender_name,
    documentDate: row.document_date,
    signatureImageUrl: row.signature_image_url,
    status: (row.status === "SENT" ? "SENT" : "DRAFT") as BusinessDocumentStatus,
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export type SaveBusinessDocumentInput = BusinessDocumentDraft & {
  recipientEmail?: string;
  id?: string | null;
  status?: BusinessDocumentStatus;
};

export async function listBusinessDocuments(limit = 40): Promise<BusinessDocumentRecord[]> {
  const rows = await prisma.business_documents.findMany({
    orderBy: { updated_at: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  return rows.map(toRecord);
}

export async function getBusinessDocument(id: string): Promise<BusinessDocumentRecord | null> {
  const row = await prisma.business_documents.findUnique({ where: { id: BigInt(id) } });
  return row ? toRecord(row) : null;
}

export async function saveBusinessDocument(
  input: SaveBusinessDocumentInput
): Promise<BusinessDocumentRecord> {
  const status = input.status ?? "DRAFT";
  const data = {
    subject: input.subject.trim() || BUSINESS_DOCUMENT_SUBJECT,
    body_text: input.bodyText,
    recipient_name: input.recipientName.trim(),
    recipient_email: (input.recipientEmail ?? "").trim(),
    brand_name: input.brandName.trim(),
    sender_name: input.senderName.trim(),
    document_date: input.documentDate,
    signature_image_url: input.signatureImageUrl?.trim() || null,
    status,
    ...(status === "SENT" ? { sent_at: new Date() } : {}),
  };

  if (input.id) {
    const row = await prisma.business_documents.update({
      where: { id: BigInt(input.id) },
      data,
    });
    return toRecord(row);
  }

  const row = await prisma.business_documents.create({ data });
  return toRecord(row);
}

export async function deleteBusinessDocument(id: string): Promise<void> {
  await prisma.business_documents.delete({ where: { id: BigInt(id) } });
}

async function fetchSiteSettingRow(key: string): Promise<string | null> {
  try {
    const row = await prisma.site_settings.findUnique({ where: { key } });
    const v = row?.value?.trim();
    return v || null;
  } catch {
    return null;
  }
}

async function fetchLogoUrl(): Promise<string | null> {
  const fromDb = await fetchSiteSettingRow("logo_main_url");
  if (fromDb) return fromDb;
  try {
    const res = await fetch(`${getSiteOrigin()}/api/storefront/site-settings`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, string>;
    return data.logo_main_url ?? null;
  } catch {
    return null;
  }
}

export async function fetchDefaultSignatureUrl(): Promise<string | null> {
  return fetchSiteSettingRow(FOUNDER_SIGNATURE_SETTING_KEY);
}

export async function sendBusinessDocumentEmail(
  input: BusinessDocumentDispatchInput
): Promise<BusinessDocumentSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY is not configured" };

  const to = input.recipientEmail.trim();
  if (!to) return { success: false, error: "Recipient email is required" };

  const {
    recipientEmail: _email,
    bodyText,
    subject: subjectIn,
    signatureImageUrl,
    documentId,
    ...fields
  } = input;
  const plain = bodyText.trim() || buildBusinessDocumentPlainText(fields);
  const subject = subjectIn.trim() || BUSINESS_DOCUMENT_SUBJECT;
  const logoUrl = await fetchLogoUrl();
  const sigUrl =
    signatureImageUrl?.trim() || (await fetchDefaultSignatureUrl()) || null;
  const html = buildBusinessDocumentEmailHtml(plain, logoUrl, subject, sigUrl);

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text: plain,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }

    const saved = await saveBusinessDocument({
      id: documentId ?? null,
      ...fields,
      bodyText: plain,
      subject,
      signatureImageUrl: sigUrl,
      recipientEmail: to,
      status: "SENT",
    });

    return { success: true, error: null, documentId: saved.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
