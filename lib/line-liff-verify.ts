import "server-only";

const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export type VerifiedLiffToken = {
  lineUserId: string;
  name?: string;
  picture?: string;
  email?: string;
};

export function getLineLoginChannelId(): string {
  return process.env.LINE_LOGIN_CHANNEL_ID ?? process.env.LINE_CLIENT_ID ?? "";
}

export async function verifyLiffIdToken(idToken: string): Promise<VerifiedLiffToken> {
  const clientId = getLineLoginChannelId();
  if (!clientId.trim()) {
    throw new Error("LINE_LOGIN_CHANNEL_ID not configured");
  }

  const res = await fetch(LINE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: clientId,
    }),
  });

  if (!res.ok) {
    throw new Error("invalid_token");
  }

  const data = (await res.json()) as {
    sub?: string;
    name?: string;
    picture?: string;
    email?: string;
  };

  if (!data.sub?.trim()) {
    throw new Error("invalid_token");
  }

  return {
    lineUserId: data.sub,
    name: data.name,
    picture: data.picture,
    email: data.email,
  };
}
