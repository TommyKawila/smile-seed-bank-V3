import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { EditorialError } from "@/lib/editorial-types";

export function editorialJsonError(
  status: number,
  error: string
): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export function editorialUnauthorized(): NextResponse {
  return editorialJsonError(401, "Unauthorized");
}

export function readBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function editorialTokensMatch(
  provided: string,
  expected: string
): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isEditorialAuthorized(
  authorizationHeader: string | null,
  expectedKey: string | undefined
): boolean {
  const expected = expectedKey?.trim();
  if (!expected) return false;
  const token = readBearerToken(authorizationHeader);
  if (!token) return false;
  return editorialTokensMatch(token, expected);
}

export function assertEditorialAuth(request: Request): NextResponse | null {
  if (
    !isEditorialAuthorized(
      request.headers.get("authorization"),
      process.env.EDITORIAL_API_KEY
    )
  ) {
    return editorialUnauthorized();
  }
  return null;
}

export function editorialErrorResponse(err: unknown): NextResponse {
  if (err instanceof EditorialError) {
    return editorialJsonError(err.status, err.message);
  }
  console.error("[editorial]", err instanceof Error ? err.name : "internal error");
  return editorialJsonError(500, "Internal error");
}

export async function withEditorialAuth(
  request: Request,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const denied = assertEditorialAuth(request);
  if (denied) return denied;
  try {
    return await handler();
  } catch (err) {
    return editorialErrorResponse(err);
  }
}
