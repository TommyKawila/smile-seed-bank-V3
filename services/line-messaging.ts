// Line Messaging API Service — Admin Notifications
// Uses LINE Messaging API Push to send ONLY to the designated Admin User ID
// Requires LINE_ADMIN_USER_ID in .env.local (e.g. LINE_ADMIN_USER_ID="Uxxxxxxxxxxxx")

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const LINE_BROADCAST_URL = "https://api.line.me/v2/bot/message/broadcast";

type ServiceResult = { success: boolean; error: string | null };

// ─── Send New Order Notification to Admin ────────────────────────────────────

export async function notifyAdminNewOrder(opts: {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
  itemCount: number;
}): Promise<ServiceResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminUserId = process.env.LINE_ADMIN_USER_ID;

  if (!token) return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า" };
  if (!adminUserId) return { success: false, error: "LINE_ADMIN_USER_ID ไม่ได้ตั้งค่า — กรุณาเพิ่มใน .env.local" };

  const totalStr = opts.total.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });

  const message = {
    type: "flex",
    altText: `🛒 ออเดอร์ใหม่ #${opts.orderNumber} — ${totalStr}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#15803d",
        contents: [
          {
            type: "text",
            text: "🌿 Smile Seed Bank",
            color: "#ffffff",
            size: "sm",
            weight: "bold",
          },
          {
            type: "text",
            text: "ออเดอร์ใหม่เข้ามา!",
            color: "rgba(255,255,255,0.8)",
            size: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: `#${opts.orderNumber}`,
            size: "xxl",
            weight: "bold",
            color: "#15803d",
          },
          { type: "separator", margin: "sm" },
          buildInfoRow("👤 ลูกค้า", opts.customerName),
          buildInfoRow("📦 สินค้า", `${opts.itemCount} รายการ`),
          buildInfoRow("💳 ชำระ", opts.paymentMethod),
          buildInfoRow("💰 ยอด", totalStr),
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            backgroundColor: "#f0fdf4",
            cornerRadius: "8px",
            paddingAll: "10px",
            contents: [
              {
                type: "text",
                text: "📍 " + opts.shippingAddress,
                size: "xs",
                color: "#15803d",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#15803d",
            action: {
              type: "uri",
              label: "ดูออเดอร์ในระบบ",
              uri: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/orders`,
            },
          },
        ],
      },
    },
  };

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: adminUserId, messages: [message] }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`LINE API error ${res.status}: ${JSON.stringify(body)}`);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Admin Alerts (Low Stock, Void, Daily Closing) ───────────────────────────

export async function sendLowStockAlert(opts: {
  productName: string;
  unitLabel: string;
  stock: number;
}): Promise<ServiceResult> {
  const text = `🚨 [Low Stock] สินค้า ${opts.productName} (${opts.unitLabel}) เหลือเพียง ${opts.stock} ชิ้น! กรุณาเติมสต็อก`;
  return pushTextToAdmin(text);
}

export async function sendVoidOrderAlert(opts: {
  orderNumber: string;
  totalAmount: number;
  reason: string | null;
}): Promise<ServiceResult> {
  const totalStr = opts.totalAmount.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  const reasonStr = opts.reason?.trim() || "ไม่ระบุ";
  const text = `⚠️ [Void Order] ออเดอร์ #${opts.orderNumber} ถูกยกเลิก!\nเหตุผล: ${reasonStr}\nยอดเงิน: ${totalStr} บาท`;
  return pushTextToAdmin(text);
}

export async function sendDailyClosingAlert(opts: {
  date: string;
  totalSales: number;
  orderCount: number;
}): Promise<ServiceResult> {
  const totalStr = opts.totalSales.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  const text = `📊 [Daily Summary] สรุปยอดขายวันที่ ${opts.date}: ยอดรวม ${totalStr} บาท (ออเดอร์ทั้งหมด ${opts.orderCount} รายการ)`;
  return pushTextToAdmin(text);
}

// ─── Push Text Message to Admin only ────────────────────────────────────────
// For quick admin alerts (e.g. low stock warning). Never used for customer data.

export async function pushTextToAdmin(text: string): Promise<ServiceResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminUserId = process.env.LINE_ADMIN_USER_ID;

  if (!token) return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า" };
  if (!adminUserId) return { success: false, error: "LINE_ADMIN_USER_ID ไม่ได้ตั้งค่า" };

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: adminUserId,
        messages: [{ type: "text", text }],
      }),
    });

    if (!res.ok) throw new Error(`LINE API error ${res.status}`);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Broadcast (for marketing messages ONLY — no customer data) ───────────────
// Use this ONLY for promotional announcements to all OA followers.

export async function broadcastMarketingMessage(text: string): Promise<ServiceResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า" };

  try {
    const res = await fetch(LINE_BROADCAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages: [{ type: "text", text }] }),
    });

    if (!res.ok) throw new Error(`LINE API error ${res.status}`);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Send Shipping Alert to Customer ─────────────────────────────────────────

const CARRIER_LABELS: Record<string, string> = {
  THAILAND_POST: "ไปรษณีย์ไทย (Thailand Post)",
  KERRY_EXPRESS: "Kerry Express",
  FLASH_EXPRESS: "Flash Express",
  "J&T_EXPRESS": "J&T Express",
};

function buildCarrierTrackingUrl(trackingNumber: string, provider: string): string {
  const t = encodeURIComponent(trackingNumber);
  switch (provider) {
    case "THAILAND_POST": return `https://track.thailandpost.co.th/?trackNumber=${t}`;
    case "FLASH_EXPRESS": return `https://www.flashexpress.co.th/tracking/?se=${t}`;
    case "J&T_EXPRESS":   return `https://www.jtexpress.co.th/trajectoryQuery?waybillNo=${t}`;
    default:              return `https://th.kerryexpress.com/en/track/?track=${t}`;
  }
}

export async function sendCustomerShippingAlert(opts: {
  lineUserId: string;
  orderNumber: string;
  orderId?: number;
  trackingNumber: string;
  shippingProvider: string;
  customerName: string;
}): Promise<ServiceResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า" };

  const carrierLabel = CARRIER_LABELS[opts.shippingProvider] ?? opts.shippingProvider;
  const trackUrl = buildCarrierTrackingUrl(opts.trackingNumber, opts.shippingProvider);

  // Absolute URL required for LINE in-app browser (iOS/Android). Must be https in production.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const origin = baseUrl.includes("localhost")
    ? baseUrl
    : (baseUrl.startsWith("http") ? baseUrl.replace(/^http:\/\//i, "https://") : `https://${baseUrl}`);
  const orderDeepLink =
    opts.orderId != null
      ? `${origin}/profile?tab=orders&open=${opts.orderId}`
      : `${origin}/profile?tab=orders`;

  const message = {
    type: "flex",
    altText: `🚚 ออเดอร์ #${opts.orderNumber} จัดส่งแล้ว — เลขพัสดุ: ${opts.trackingNumber}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#15803d",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "🌿 Smile Seed Bank",
            color: "#bbf7d0",
            size: "xs",
            weight: "bold",
          },
          {
            type: "text",
            text: "📦 พัสดุของคุณถูกส่งออกแล้ว!",
            color: "#ffffff",
            size: "md",
            weight: "bold",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: `สวัสดีคุณ ${opts.customerName} 👋`,
            size: "sm",
            color: "#18181b",
            weight: "bold",
          },
          {
            type: "text",
            text: `ออเดอร์ #${opts.orderNumber} กำลังเดินทางมาหาคุณแล้วนะครับ 🌿`,
            size: "xs",
            color: "#52525b",
            wrap: true,
          },
          { type: "separator", margin: "md" },
          buildInfoRow("🚚 ขนส่ง", carrierLabel),
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            backgroundColor: "#f0fdf4",
            cornerRadius: "12px",
            paddingAll: "14px",
            contents: [
              {
                type: "text",
                text: "เลขพัสดุ",
                size: "xxs",
                color: "#166534",
                weight: "bold",
              },
              {
                type: "text",
                text: opts.trackingNumber,
                size: "xl",
                color: "#14532d",
                weight: "bold",
                margin: "sm",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#15803d",
            height: "sm",
            action: {
              type: "uri",
              label: "🔍 ติดตามพัสดุ",
              uri: trackUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียดออเดอร์",
              uri: orderDeepLink,
            },
          },
        ],
      },
    },
  };

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: opts.lineUserId, messages: [message] }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`LINE API error ${res.status}: ${JSON.stringify(body)}`);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Push plain text to a LINE user (customer OA chat). */
export async function pushTextToLineUser(
  lineUserId: string,
  text: string
): Promise<ServiceResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า" };
  if (!lineUserId?.trim()) return { success: false, error: "Missing LINE user id" };

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId.trim(),
        messages: [{ type: "text", text }],
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`LINE API error ${res.status}: ${JSON.stringify(body)}`);
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function buildInfoRow(label: string, value: string) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "xs", color: "#71717a", flex: 2 },
      { type: "text", text: value, size: "xs", color: "#27272a", flex: 3, wrap: true },
    ],
  };
}
