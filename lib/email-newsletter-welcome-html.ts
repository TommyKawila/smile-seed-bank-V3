const CODE = "WELCOME10";

export function buildNewsletterWelcomeHtml(locale: "th" | "en", storeUrl: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const link = esc(storeUrl);
  if (locale === "en") {
    return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.65;color:#18181b;max-width:560px;margin:0;padding:16px;">
<p style="margin:0 0 12px;">Thank you for subscribing! Use code <strong style="font-size:1.05em;letter-spacing:0.06em;">${CODE}</strong> for 10% off your first order at <a href="${link}" style="color:#166534;">our store</a>.</p>
</body></html>`;
  }
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.65;color:#18181b;max-width:560px;margin:0;padding:16px;">
<p style="margin:0 0 12px;">ขอบคุณที่ติดตามเรา! ใช้โค้ด <strong style="font-size:1.05em;letter-spacing:0.06em;">${CODE}</strong> เพื่อรับส่วนลด 10% สำหรับการสั่งซื้อครั้งแรกของคุณที่ <a href="${link}" style="color:#166534;">ร้านค้า</a></p>
</body></html>`;
}
