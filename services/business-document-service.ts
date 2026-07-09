import { getSiteOrigin } from "@/lib/get-url";
import { buildBusinessDocumentEmailHtml } from "@/lib/email-business-document-html";
import { BUSINESS_DOCUMENT_SUBJECT } from "@/types/business-document";
import type { BusinessDocumentDispatchInput } from "@/types/business-document";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Smile Seed Bank <orders@smileseedbank.com>";

export type BusinessDocumentSendResult = { success: boolean; error: string | null };

async function fetchLogoUrl(): Promise<string | null> {
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

export async function sendBusinessDocumentEmail(
  input: BusinessDocumentDispatchInput
): Promise<BusinessDocumentSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY is not configured" };

  const to = input.recipientEmail.trim();
  if (!to) return { success: false, error: "Recipient email is required" };

  const { bodyText } = input;
  const plain = bodyText.trim();
  if (!plain) return { success: false, error: "Document body is required" };
  const logoUrl = await fetchLogoUrl();
  const html = buildBusinessDocumentEmailHtml(plain, logoUrl);

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
        subject: BUSINESS_DOCUMENT_SUBJECT,
        html,
        text: plain,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
