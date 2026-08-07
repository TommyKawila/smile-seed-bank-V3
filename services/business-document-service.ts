import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";
import { buildBusinessDocumentEmailHtml } from "@/lib/email-business-document-html";
import {
  BUSINESS_DOCUMENT_FALLBACK_SUBJECT,
  FOUNDER_SIGNATURE_SETTING_KEY,
} from "@/types/business-document";
import type {
  BusinessDocumentDispatchInput,
  BusinessDocumentDraft,
  BusinessDocumentRecord,
  BusinessDocumentStatus,
} from "@/types/business-document";
import type { BusinessContactRecord } from "@/types/business-contact";

export type { BusinessContactRecord };

const RESEND_URL = "https://api.resend.com/emails";
const FROM_RESEND = "Smile Seed Bank <orders@smileseedbank.com>";
const DEFAULT_GMAIL_USER = "smileseedsbank@gmail.com";

export type BusinessDocumentSendResult = {
  success: boolean;
  error: string | null;
  documentId?: string;
  via?: "gmail" | "resend";
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

export async function upsertBusinessContact(input: {
  name: string;
  email: string;
  subject?: string;
}): Promise<BusinessContactRecord | null> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  const name = input.name.trim();
  const subject = (input.subject ?? "").trim().slice(0, 300);
  const now = new Date();
  const row = await prisma.business_contacts.upsert({
    where: { email },
    create: {
      email,
      name,
      last_subject: subject,
      last_contacted_at: now,
    },
    update: {
      ...(name ? { name } : {}),
      ...(subject ? { last_subject: subject } : {}),
      last_contacted_at: now,
    },
  });
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    lastSubject: row.last_subject,
    lastContactedAt: row.last_contacted_at.toISOString(),
  };
}

export async function listBusinessContacts(limit = 50): Promise<BusinessContactRecord[]> {
  const rows = await prisma.business_contacts.findMany({
    orderBy: { last_contacted_at: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    email: r.email,
    lastSubject: r.last_subject,
    lastContactedAt: r.last_contacted_at.toISOString(),
  }));
}

export async function saveBusinessDocument(
  input: SaveBusinessDocumentInput
): Promise<BusinessDocumentRecord> {
  const status = input.status ?? "DRAFT";
  const data = {
    subject: input.subject.trim() || BUSINESS_DOCUMENT_FALLBACK_SUBJECT,
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

  let row;
  if (input.id) {
    row = await prisma.business_documents.update({
      where: { id: BigInt(input.id) },
      data,
    });
  } else {
    row = await prisma.business_documents.create({ data });
  }

  const email = data.recipient_email.trim();
  if (email) {
    await upsertBusinessContact({
      name: data.recipient_name,
      email,
      subject: data.subject,
    });
  }

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

function gmailSmtpConfigured(): { user: string; pass: string } | null {
  const user = (process.env.B2B_GMAIL_USER ?? DEFAULT_GMAIL_USER).trim();
  const pass = (process.env.B2B_GMAIL_APP_PASSWORD ?? "").trim();
  if (!pass) return null;
  return { user, pass };
}

async function sendViaGmail(opts: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: opts.user, pass: opts.pass },
  });
  await transporter.sendMail({
    from: `Smile Seed Bank <${opts.user}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

async function sendViaResend(opts: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}): Promise<void> {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      from: FROM_RESEND,
      to: [opts.to],
      reply_to: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }
}

export async function sendBusinessDocumentEmail(
  input: BusinessDocumentDispatchInput
): Promise<BusinessDocumentSendResult> {
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
  const plain = bodyText.trim();
  if (!plain) return { success: false, error: "Letter body is required" };
  const subject = subjectIn.trim() || BUSINESS_DOCUMENT_FALLBACK_SUBJECT;
  const logoUrl = await fetchLogoUrl();
  const sigUrl =
    signatureImageUrl?.trim() || (await fetchDefaultSignatureUrl()) || null;
  const [companyEmail, companyPhone] = await Promise.all([
    fetchSiteSettingRow("company_email"),
    fetchSiteSettingRow("company_phone"),
  ]);
  const html = buildBusinessDocumentEmailHtml(plain, logoUrl, subject, sigUrl, {
    companyEmail,
    companyPhone,
    locale: "en",
  });

  const gmail = gmailSmtpConfigured();
  const replyTo = (process.env.B2B_GMAIL_USER ?? DEFAULT_GMAIL_USER).trim();

  try {
    let via: "gmail" | "resend" = "resend";
    if (gmail) {
      await sendViaGmail({
        user: gmail.user,
        pass: gmail.pass,
        to,
        subject,
        html,
        text: plain,
      });
      via = "gmail";
    } else {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error:
            "Set B2B_GMAIL_APP_PASSWORD (Gmail App Password) or RESEND_API_KEY to send",
        };
      }
      await sendViaResend({
        apiKey,
        to,
        subject,
        html,
        text: plain,
        replyTo,
      });
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

    return { success: true, error: null, documentId: saved.id, via };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
