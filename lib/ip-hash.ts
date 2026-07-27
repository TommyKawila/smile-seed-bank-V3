import { createHash } from "crypto";

/** SHA-256 hash of IP — never store raw IP in DB/Redis keys. */
export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip.trim() || "unknown").digest("hex").slice(0, 16);
}
