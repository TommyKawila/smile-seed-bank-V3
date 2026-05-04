import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStorefrontReceiptPdfSettingsServer } from "@/lib/pdf-settings.server";
import { verifyReceiptDownloadQuery } from "@/lib/receipt-download-token";
import { isReceiptEligibleStatus } from "@/lib/receipt-pdf";
import { getOrderForSuccessView } from "@/lib/services/order-service";
import { buildOrderReceiptPdfDocument } from "@/lib/storefront-order-receipt-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber: raw } = await context.params;
    const orderNumber = decodeURIComponent(raw ?? "")
      .replace(/^#/, "")
      .trim();

    const t = req.nextUrl.searchParams.get("t") ?? "";
    const e = req.nextUrl.searchParams.get("e") ?? "";
    const tokenOk = Boolean(t && e && verifyReceiptDownloadQuery(orderNumber, t, e));

    console.log("[storefront/receipt] request", {
      orderNumber,
      hasTokenT: !!t,
      expiryUnix: e || null,
      tokenOk,
    });

    if (!orderNumber || orderNumber.length < 4 || orderNumber.length > 48) {
      return jsonError("Invalid order number", 400);
    }

    let userId: string | null = null;
    if (!tokenOk) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      console.log("[storefront/receipt] session", { hasUser: !!userId });
    }

    const { data: order, error } = await getOrderForSuccessView(orderNumber, userId, {
      skipCustomerAuth: tokenOk,
    });

    console.log("[storefront/receipt] getOrderForSuccessView", {
      error: error ?? null,
      hasOrder: !!order,
      status: order?.status ?? null,
      itemCount: order?.items?.length ?? 0,
      orderDate: order?.order_date ?? null,
    });

    if (error === "not_found" || !order) {
      return jsonError("Not found", 404, { code: "NOT_FOUND" });
    }
    if (error === "login_required") {
      return jsonError("Login required", 401, { code: "LOGIN_REQUIRED" });
    }
    if (error === "forbidden") {
      return jsonError("Forbidden", 403, { code: "FORBIDDEN" });
    }
    if (error === "server") {
      return jsonError("Server error", 500, { code: "ORDER_LOAD" });
    }

    if (!isReceiptEligibleStatus(order.status, order.payment_status)) {
      return jsonError("Receipt not available for this status", 403, {
        code: "STATUS",
        status: order.status,
      });
    }

    let pdfSettings: Awaited<ReturnType<typeof getStorefrontReceiptPdfSettingsServer>>;
    try {
      pdfSettings = await getStorefrontReceiptPdfSettingsServer();
    } catch (settingsErr) {
      console.error("[storefront/receipt] pdfSettings failed", settingsErr);
      return jsonError("Could not load PDF settings", 500, {
        code: "PDF_SETTINGS",
        detail: settingsErr instanceof Error ? settingsErr.message : String(settingsErr),
      });
    }

    console.log("[storefront/receipt] pdfSettings", {
      companyName: pdfSettings.companyName,
      hasLogo: !!pdfSettings.logoDataUrl,
      logoLen: pdfSettings.logoDataUrl?.length ?? 0,
    });

    const langRaw = req.nextUrl.searchParams.get("lang")?.toLowerCase();
    const pdfLocale = langRaw === "en" ? "en" : "th";

    let doc: Awaited<ReturnType<typeof buildOrderReceiptPdfDocument>>;
    try {
      doc = await buildOrderReceiptPdfDocument(order, pdfSettings, { locale: pdfLocale });
    } catch (buildErr) {
      console.error("[storefront/receipt] buildOrderReceiptPdfDocument", buildErr);
      return jsonError("PDF build failed", 500, {
        code: "PDF_BUILD",
        detail: buildErr instanceof Error ? buildErr.message : String(buildErr),
      });
    }

    let buf: Buffer;
    try {
      const out = doc.output("arraybuffer");
      buf = Buffer.from(out as ArrayBuffer);
    } catch (outErr) {
      console.error("[storefront/receipt] doc.output", outErr);
      return jsonError("PDF output failed", 500, {
        code: "PDF_OUTPUT",
        detail: outErr instanceof Error ? outErr.message : String(outErr),
      });
    }

    if (!buf.length || buf[0] !== 0x25) {
      // % = start of %PDF
      console.error("[storefront/receipt] invalid pdf buffer", { length: buf.length, head: buf.subarray(0, 8).toString("utf8") });
      return jsonError("Invalid PDF bytes", 500, { code: "PDF_EMPTY", length: buf.length });
    }

    const body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${order.order_number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[storefront/receipt] unhandled", err);
    return jsonError("Receipt download failed", 500, {
      code: "UNHANDLED",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
