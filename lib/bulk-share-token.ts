import { createHmac, timingSafeEqual } from "node:crypto";
import type { BulkSupplierSlug } from "@/lib/bulk-seeds-book";

export type BulkSharePayload = {
  v: 1;
  exp: number;
  title: string;
  suppliers: BulkSupplierSlug[];
  showStrains: boolean;
  gmOverride: number | null;
  landed: Partial<Record<BulkSupplierSlug, number>>;
  eurThb: number;
};

function secret(): string {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

function b64url(buf: Buffer | string): string {
  const raw = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return raw.toString("base64url");
}

function sign(body: string): string {
  const key = secret();
  if (!key) throw new Error("Missing signing secret");
  return createHmac("sha256", key).update(body).digest("base64url");
}

export function mintBulkShareToken(payload: BulkSharePayload): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function readBulkShareToken(token: string): BulkSharePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  try {
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as BulkSharePayload;
    if (json.v !== 1 || !Array.isArray(json.suppliers) || json.suppliers.length === 0) {
      return null;
    }
    if (json.exp < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}
