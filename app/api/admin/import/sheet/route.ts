import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Parse spreadsheet ID and optional tab gid from common Google Sheets URLs:
 * - .../spreadsheets/d/[ID]/edit#gid=...
 * - .../spreadsheets/d/[ID]/edit?gid=...
 * - .../spreadsheets/d/[ID]/view
 * - .../spreadsheets/d/[ID]/pubhtml (published)
 */
export function parseGoogleSheetIdAndGid(input: string): { id: string; gid: string | null } | null {
  const trimmed = input.trim();
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch?.[1]) return null;
  const id = idMatch[1];
  // gid may appear in hash (#gid=), query (?gid= or &gid=)
  const gidMatch = trimmed.match(/[#?&]gid=(\d+)/);
  const gid = gidMatch?.[1] ?? null;
  return { id, gid };
}

/** Build the official CSV export URL (same host/path pattern Google uses for export). */
export function googleSheetUrlToCsvExportUrl(input: string): string | null {
  const parsed = parseGoogleSheetIdAndGid(input);
  if (!parsed) return null;
  let u = `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv`;
  if (parsed.gid != null) u += `&gid=${parsed.gid}`;
  return u;
}

/**
 * GET /api/admin/import/sheet?url=...
 * Fetches public CSV export. Sheet must be shared (e.g. "Anyone with the link can view").
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json({ error: "url query required" }, { status: 400 });
  }
  const csvUrl = googleSheetUrlToCsvExportUrl(url);
  if (!csvUrl) {
    return NextResponse.json(
      { error: "Invalid Google Sheets URL (expected /spreadsheets/d/.../)" },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(csvUrl, {
      headers: { "User-Agent": "SmileSeedBank-Admin/1.0" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Google returned ${res.status}. Ensure the sheet is shared publicly or “Anyone with the link can view”.`,
        },
        { status: 502 }
      );
    }
    const csv = await res.text();
    return NextResponse.json({ csv });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
