/** Flex reply when a guest links LINE ↔ order via OA chat. */
export function buildOrderLineLinkSuccessFlex(orderNumber: string): {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
} {
  const num = orderNumber.trim() || "—";
  return {
    type: "flex",
    altText: `เชื่อมต่อออเดอร์ ${num} สำเร็จ`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "14px",
        contents: [
          {
            type: "text",
            text: "✅ เชื่อมต่อสำเร็จ",
            weight: "bold",
            size: "sm",
            color: "#166534",
          },
          {
            type: "text",
            text: `Order #${num}`,
            size: "xs",
            color: "#374151",
            wrap: true,
          },
          {
            type: "text",
            text: "เราจะแจ้งเตือนคุณเมื่อพัสดุถูกจัดส่ง",
            size: "xs",
            color: "#6b7280",
            wrap: true,
          },
          {
            type: "text",
            text: "We will notify you when your parcel ships.",
            size: "xxs",
            color: "#9ca3af",
            wrap: true,
          },
        ],
      },
    },
  };
}
