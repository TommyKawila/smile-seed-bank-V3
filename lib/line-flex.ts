import { getSiteOrigin } from "@/lib/get-url";
import { computeOrderReceiptFinancials, type OrderReceiptDetailInput } from "@/lib/order-receipt-math";

/**
 * LINE in-app WebView blocks some OAuth flows (e.g. Google). Appending `openExternalBrowser=1`
 * asks many LINE clients to open the URL in the system browser instead of the in-app WebView.
 */
export function appendLineOpenExternalBrowserParam(url: string): string {
  const raw = url.trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (u.searchParams.get("openExternalBrowser") === "1") return raw;
    u.searchParams.set("openExternalBrowser", "1");
    return u.toString();
  } catch {
    if (/[?&]openExternalBrowser=1(?:&|$|#)/.test(raw)) return raw;
    return raw.includes("?") ? `${raw}&openExternalBrowser=1` : `${raw}?openExternalBrowser=1`;
  }
}

export type OrderFlexMessageInput = OrderReceiptDetailInput & {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  /** Signed storefront URL to download PDF (from admin line-flex route). */
  receiptDownloadUri?: string | null;
};

function formatBaht(n: number): string {
  const r = Math.round(n * 100) / 100;
  const opts: Intl.NumberFormatOptions = Number.isInteger(r)
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `฿${r.toLocaleString("th-TH", opts)}`;
}

function compactAddress(raw: string | null | undefined, maxLen = 120): string {
  const s = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "—";
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

function itemLineLabel(
  productName: string,
  breeder: string | null,
  pack: string,
  qty: number
): string {
  const b = (breeder ?? "").trim();
  const p = pack.trim() || "—";
  const core = b ? `${productName} by ${b} (${p})` : `${productName} (${p})`;
  return `${core} × ${qty}`;
}

type MiniReceiptParts = {
  orderNum: string;
  grandTotal: number;
  detailUrl: string;
  receiptDownloadUri: string | null;
  bodyContents: Record<string, unknown>[];
};

function buildMiniReceiptFlexParts(order: OrderFlexMessageInput): MiniReceiptParts {
  const receiptDownloadUriRaw = order.receiptDownloadUri?.trim() || null;
  const receiptDownloadUri = receiptDownloadUriRaw
    ? appendLineOpenExternalBrowserParam(receiptDownloadUriRaw)
    : null;
  const { itemsGrossSubtotal, discountForPdf, shippingFee, grandTotal } = computeOrderReceiptFinancials(order);
  const orderNum = order.orderNumber.trim() || "—";

  const itemTexts = order.items.slice(0, 14).map((it) =>
    itemLineLabel(it.productName, it.breederName, it.unitLabel, it.quantity)
  );
  if (order.items.length > 14) {
    itemTexts.push(`… +${order.items.length - 14} รายการ`);
  }

  const itemNodes: Record<string, unknown>[] = [
    {
      type: "text",
      text: "รายการสินค้า / Items",
      size: "xs",
      color: "#71717a",
      weight: "bold",
    },
    ...itemTexts.map((text) => ({
      type: "text" as const,
      text,
      size: "xs" as const,
      color: "#27272a",
      wrap: true,
      margin: "sm" as const,
    })),
    { type: "separator", margin: "md" },
  ];

  const financialRows: Record<string, unknown>[] = [
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "ยอดรวมสินค้า (ก่อนส่วนลด) / Items Subtotal",
          size: "xs",
          color: "#71717a",
          flex: 5,
          wrap: true,
        },
        {
          type: "text",
          text: formatBaht(itemsGrossSubtotal),
          size: "xs",
          color: "#71717a",
          flex: 3,
          align: "end",
        },
      ],
    },
  ];

  if (discountForPdf > 0.005) {
    financialRows.push({
      type: "box",
      layout: "horizontal",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: "ส่วนลด / Discount",
          size: "xs",
          color: "#ea580c",
          weight: "bold",
          flex: 5,
          wrap: true,
        },
        {
          type: "text",
          text: `-${formatBaht(discountForPdf)}`,
          size: "xs",
          color: "#dc2626",
          weight: "bold",
          flex: 3,
          align: "end",
        },
      ],
    });
  }

  if (shippingFee > 0.005) {
    financialRows.push({
      type: "box",
      layout: "horizontal",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: "ค่าจัดส่ง / Shipping",
          size: "xs",
          color: "#71717a",
          flex: 5,
        },
        {
          type: "text",
          text: formatBaht(shippingFee),
          size: "xs",
          color: "#52525b",
          flex: 3,
          align: "end",
        },
      ],
    });
  }

  financialRows.push({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "text",
        text: "ยอดรวมสุทธิ / Net Grand Total",
        size: "md",
        color: "#166534",
        weight: "bold",
        flex: 5,
        wrap: true,
      },
      {
        type: "text",
        text: formatBaht(grandTotal),
        size: "xl",
        color: "#166534",
        weight: "bold",
        flex: 3,
        align: "end",
      },
    ],
  });

  const shipBlock: Record<string, unknown>[] = [
    { type: "separator", margin: "md" },
    {
      type: "text",
      text: "จัดส่ง / Shipping",
      size: "xs",
      color: "#71717a",
      weight: "bold",
    },
    {
      type: "text",
      text: `ชื่อ / Name: ${(order.customerName ?? "—").trim() || "—"}`,
      size: "xs",
      color: "#3f3f46",
      wrap: true,
      margin: "sm",
    },
    {
      type: "text",
      text: `โทร / Phone: ${(order.customerPhone ?? "—").trim() || "—"}`,
      size: "xs",
      color: "#3f3f46",
      wrap: true,
    },
    {
      type: "text",
      text: `ที่อยู่ / Address: ${compactAddress(order.shippingAddress)}`,
      size: "xs",
      color: "#3f3f46",
      wrap: true,
      margin: "sm",
    },
  ];

  const origin = getSiteOrigin();
  const detailUrl = appendLineOpenExternalBrowserParam(
    `${origin}/order-success/${encodeURIComponent(orderNum)}`
  );
  const bodyContents = [...itemNodes, ...financialRows, ...shipBlock];

  return {
    orderNum,
    grandTotal,
    detailUrl,
    receiptDownloadUri,
    bodyContents,
  };
}

/** LINE Messaging API Flex Message (single bubble). Numbers match `computeOrderReceiptFinancials` / PDF. */
export function generateOrderFlexMessage(order: OrderFlexMessageInput): {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
} {
  const p = buildMiniReceiptFlexParts(order);
  const altText = `Smile Seed Bank | Order #${p.orderNum} — ${formatBaht(p.grandTotal)}`;

  return {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        backgroundColor: "#166534",
        contents: [
          {
            type: "text",
            text: `Smile Seed Bank | Order #${p.orderNum}`,
            color: "#ffffff",
            size: "md",
            weight: "bold",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        spacing: "sm",
        contents: p.bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#166534",
            action: {
              type: "uri",
              label: "ดูรายละเอียด / View Details",
              uri: p.detailUrl,
            },
          },
          ...(p.receiptDownloadUri
            ? [
                {
                  type: "button" as const,
                  style: "secondary" as const,
                  action: {
                    type: "uri" as const,
                    label: "ดาวน์โหลดใบเสร็จ (PDF)",
                    uri: p.receiptDownloadUri,
                  },
                },
              ]
            : []),
        ],
      },
    },
  };
}

/** Mini receipt — payment confirmed (admin approval → PAID). */
export function generatePaymentConfirmedFlexMessage(order: OrderFlexMessageInput): {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
} {
  const p = buildMiniReceiptFlexParts(order);
  const altText = `ชำระเงินแล้ว · Order #${p.orderNum} — ${formatBaht(p.grandTotal)}`;

  return {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        backgroundColor: "#15803d",
        contents: [
          {
            type: "text",
            text: "ได้รับยอดโอนเรียบร้อยแล้ว!",
            color: "#ffffff",
            size: "lg",
            weight: "bold",
            wrap: true,
          },
          {
            type: "text",
            text: "Payment received — thank you",
            color: "#dcfce7",
            size: "xs",
            margin: "sm",
            wrap: true,
          },
          {
            type: "text",
            text: `Order #${p.orderNum}`,
            color: "#ffffff",
            size: "sm",
            weight: "bold",
            margin: "md",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        spacing: "sm",
        contents: p.bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#15803d",
            action: {
              type: "uri",
              label: "ดูรายละเอียดออเดอร์ / View Order Details",
              uri: p.detailUrl,
            },
          },
          ...(p.receiptDownloadUri
            ? [
                {
                  type: "button" as const,
                  style: "secondary" as const,
                  action: {
                    type: "uri" as const,
                    label: "ดาวน์โหลดใบเสร็จ (PDF)",
                    uri: p.receiptDownloadUri,
                  },
                },
              ]
            : []),
        ],
      },
    },
  };
}

export type ShippedFlexInput = {
  orderNumber: string;
  trackingNumber: string;
  shippingProviderLabel: string;
  detailUrl: string;
  trackingUrl: string | null;
};

export function generateOrderShippedFlexMessage(input: ShippedFlexInput): {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
} {
  const on = input.orderNumber.trim() || "—";
  const tn = input.trackingNumber.trim();
  const altText = `จัดส่งแล้ว · Order #${on} · ${tn}`;

  const trackBtn = input.trackingUrl
    ? [
        {
          type: "button" as const,
          style: "primary" as const,
          color: "#0f766e",
          action: {
            type: "uri" as const,
            label: "ติดตามพัสดุ / Track parcel",
            uri: appendLineOpenExternalBrowserParam(input.trackingUrl),
          },
        },
      ]
    : [];

  return {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        backgroundColor: "#0f766e",
        contents: [
          {
            type: "text",
            text: "พัสดุจัดส่งแล้ว",
            color: "#ffffff",
            size: "lg",
            weight: "bold",
            wrap: true,
          },
          {
            type: "text",
            text: "Your order is on the way",
            color: "#ccfbf1",
            size: "xs",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `Order #${on}`,
            size: "md",
            weight: "bold",
            color: "#18181b",
            wrap: true,
          },
          {
            type: "text",
            text: `ขนส่ง / Carrier: ${input.shippingProviderLabel}`,
            size: "sm",
            color: "#52525b",
            wrap: true,
          },
          {
            type: "text",
            text: `เลขพัสดุ / Tracking: ${tn}`,
            size: "sm",
            color: "#0f766e",
            weight: "bold",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        spacing: "sm",
        contents: [
          ...trackBtn,
          {
            type: "button",
            style: trackBtn.length ? "secondary" : "primary",
            color: trackBtn.length ? "#64748b" : "#0f766e",
            action: {
              type: "uri",
              label: "ดูสถานะออเดอร์ / View order",
              uri: appendLineOpenExternalBrowserParam(input.detailUrl),
            },
          },
        ],
      },
    },
  };
}

/**
 * Order just placed (PENDING) — thank-you + reminder to pay & upload slip.
 * `paymentUrl` should deep-link to the storefront payment page for this order.
 */
export function generateOrderPlacedFlexMessage(
  order: OrderFlexMessageInput & { paymentUrl?: string | null }
): {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
} {
  const p = buildMiniReceiptFlexParts(order);
  const altText = `ได้รับออเดอร์ #${p.orderNum} — ${formatBaht(p.grandTotal)}`;
  const paymentUrl = order.paymentUrl?.trim()
    ? appendLineOpenExternalBrowserParam(order.paymentUrl.trim())
    : null;

  return {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        backgroundColor: "#166534",
        contents: [
          {
            type: "text",
            text: "ขอบคุณสำหรับคำสั่งซื้อ! 🌿",
            color: "#ffffff",
            size: "lg",
            weight: "bold",
            wrap: true,
          },
          {
            type: "text",
            text: "Thank you for your order",
            color: "#bbf7d0",
            size: "xs",
            margin: "sm",
            wrap: true,
          },
          {
            type: "text",
            text: `Order #${p.orderNum}`,
            color: "#ffffff",
            size: "sm",
            weight: "bold",
            margin: "md",
            wrap: true,
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            backgroundColor: "#fbbf24",
            cornerRadius: "6px",
            paddingAll: "6px",
            contents: [
              {
                type: "text",
                text: "⏳ รอชำระเงิน / Awaiting payment",
                color: "#78350f",
                size: "xxs",
                weight: "bold",
                align: "center",
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        spacing: "sm",
        contents: p.bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        spacing: "sm",
        contents: [
          ...(paymentUrl
            ? [
                {
                  type: "button" as const,
                  style: "primary" as const,
                  color: "#166534",
                  action: {
                    type: "uri" as const,
                    label: "ชำระเงิน / Pay now",
                    uri: paymentUrl,
                  },
                },
              ]
            : []),
          {
            type: "button",
            style: paymentUrl ? "secondary" : "primary",
            color: paymentUrl ? "#64748b" : "#166534",
            action: {
              type: "uri",
              label: "ดูรายละเอียด / View order",
              uri: p.detailUrl,
            },
          },
        ],
      },
    },
  };
}
