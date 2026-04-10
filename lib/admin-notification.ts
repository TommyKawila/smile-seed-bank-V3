/**
 * Central admin alerts via LINE Messaging API (push to admin user).
 * Uses LINE_ADMIN_TOKEN (or LINE_CHANNEL_ACCESS_TOKEN) + LINE_ADMIN_USER_ID.
 * Never throws; failures are logged only.
 */

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

function lineToken(): string | null {
  return (
    process.env.LINE_ADMIN_TOKEN?.trim() ||
    process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() ||
    null
  );
}

function lineAdminUserId(): string | null {
  return process.env.LINE_ADMIN_USER_ID?.trim() || null;
}

export async function sendAdminNotification(message: string): Promise<void> {
  const token = lineToken();
  const to = lineAdminUserId();
  if (!token || !to) return;

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: message }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[admin-notification] LINE push failed", res.status, body);
    }
  } catch (e) {
    console.warn("[admin-notification]", e);
  }
}
