import "server-only";

import { createSign, randomUUID } from "crypto";
import type { GfClaimUploadedFile } from "@/lib/gf-seed-claim-form";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign(sa.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Drive token failed: ${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Drive token missing");
  return json.access_token;
}

async function driveApiError(res: Response, label: string): Promise<never> {
  let detail = "";
  try {
    const json = (await res.json()) as { error?: { message?: string; errors?: { reason?: string }[] } };
    detail = json.error?.message ?? JSON.stringify(json);
    const reason = json.error?.errors?.[0]?.reason;
    if (reason) detail += ` (${reason})`;
  } catch {
    detail = await res.text().catch(() => "");
  }
  throw new Error(`${label}: ${res.status}${detail ? ` — ${detail}` : ""}`);
}

export async function uploadClaimFileToDrive(params: {
  claimSessionId: string;
  category: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<GfClaimUploadedFile> {
  const parentId = process.env.GOOGLE_DRIVE_CLAIM_FOLDER_ID?.trim();
  const sa = readServiceAccount();
  if (!parentId || !sa) {
    throw new Error("Google Drive not configured");
  }

  const token = await getAccessToken(sa);
  // Upload into the boss-shared parent folder (user-owned quota).
  // SA-owned subfolders cannot store files — Drive returns 403.
  const safeName = params.fileName.replace(/[^\w.\-()+\s]/g, "_");
  const driveName = `claim-${params.claimSessionId}-${params.category}-${safeName}`;

  const boundary = `boundary_${randomUUID()}`;
  const metadata = JSON.stringify({
    name: driveName,
    parents: [parentId],
  });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(metadata),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`),
    params.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) await driveApiError(res, "Drive upload failed");
  const json = (await res.json()) as { id: string; webViewLink?: string };

  return {
    id: randomUUID(),
    name: params.fileName,
    mimeType: params.mimeType,
    sizeBytes: params.buffer.byteLength,
    storage: "google_drive",
    fileId: json.id,
    webViewLink: json.webViewLink,
  };
}

export function isDriveClaimUploadConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLAIM_FOLDER_ID?.trim() &&
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim()
  );
}
