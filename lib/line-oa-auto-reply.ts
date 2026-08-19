/** SSOT — LINE OA inbound auto-reply copy (TH + EN). */

export const LINE_OA_GENERAL_ACK = `Thanks for reaching Smile Seed Bank 🌱
We've received your message — our team will reply as soon as we can.

To link order updates on LINE, send:
Order #YOUR_ORDER_NUMBER
(from your confirmation email)

---
ขอบคุณที่ทัก Smile Seed Bank
ทีมงานได้รับข้อความแล้ว จะตอบกลับโดยเร็วที่สุด

เช็คสถานะออเดอร์: ส่ง Order #เลขออเดอร์ (จากอีเมลยืนยัน)`;

export const LINE_OA_ORDER_NOT_FOUND = `We couldn't find that order number. Please check from your confirmation email (e.g. Order #12345).

Your message is with our team — we'll reply shortly.

---
ไม่พบเลขออเดอร์ตามที่ส่งมา กรุณาตรวจจากอีเมลยืนยัน
ข้อความของคุณถึงทีมแล้ว เราจะตอบกลับให้ครับ`;

export function lineOaB2bAck(ref: string): string {
  return `Thanks — we received your message about quote/ref ${ref}. Our B2B team will reply shortly.

---
ได้รับข้อความเกี่ยวกับใบเสนอราคา ${ref} แล้ว ทีม B2B จะตอบกลับให้ครับ`;
}

export function lineOaAlreadyLinkedYou(orderNumber: string): string {
  return `เชื่อมต่อออเดอร์ #${orderNumber} อยู่แล้ว — เราจะแจ้งเตือนคุณเมื่อพัสดุถูกจัดส่ง

EN: Already linked; we will notify you when your order ships.`;
}

export const LINE_OA_ALREADY_LINKED_YOU_GENERIC = `เชื่อมต่อออเดอร์นี้อยู่แล้ว

EN: This order is already linked to your LINE.`;

export const LINE_OA_ALREADY_LINKED_OTHER = `ออเดอร์นี้เชื่อมกับ LINE อื่นแล้ว หากเป็นของคุณจริง กรุณาติดต่อแอดมิน

EN: This order is linked to another LINE account.`;
