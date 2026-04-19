"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <article className="mx-auto max-w-3xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        {t("นโยบายความเป็นส่วนตัว (Privacy Policy)", "Privacy Policy")}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {t(
          "อธิบายว่า Smile Seed Bank เก็บ ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณอย่างไร",
          "How Smile Seed Bank collects, uses, and protects your personal information."
        )}
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-700 sm:text-base">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("1. ข้อมูลที่เราเก็บรวบรวม", "1. Information we collect")}
          </h2>
          <p>
            {t(
              "เราอาจเก็บข้อมูลที่คุณให้โดยตรงเมื่อสร้างบัญชี สั่งซื้อ หรือติดต่อเรา เช่น ชื่อ อีเมล เบอร์โทรศัพท์ ที่อยู่จัดส่ง และข้อมูลที่เกี่ยวกับคำสั่งซื้อ นอกจากนี้ ระบบอาจบันทึกที่อยู่ IP เบราว์เซอร์ และข้อมูลทางเทคนิคอื่น ๆ เพื่อความปลอดภัยของเว็บไซต์และการวิเคราะห์การใช้งานแบบรวม (aggregated)",
              "We may collect information you provide when you register, place an order, or contact us—such as name, email, phone number, shipping address, and order-related details. Our systems may also log IP addresses, browser data, and similar technical information for security and aggregated usage analysis."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("2. การนำข้อมูลไปใช้", "2. How we use your information")}
          </h2>
          <p>
            {t(
              "เราใช้ข้อมูลเพื่อดำเนินการสั่งซื้อ ยืนยันการชำระเงิน จัดส่งสินค้า ติดต่อเกี่ยวกับออเดอร์ และให้บริการลูกค้า หากคุณสมัครรับจดหมายข่าวหรือยินยอมรับการตลาด เราอาจใช้อีเมลของคุณเพื่อส่งข่าวสาร โปรโมชั่น หรือเทคนิคการปลูก — คุณสามารถยกเลิกการรับได้ตามช่องทางที่ระบุในอีเมล",
              "We use your data to process orders, confirm payments, ship products, communicate about your purchases, and provide customer support. If you subscribe to our newsletter or opt in to marketing, we may use your email to send updates, offers, or growing tips—you can unsubscribe using the link in those messages."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("3. ความปลอดภัยของข้อมูล", "3. Data security")}
          </h2>
          <p>
            {t(
              "เราใช้มาตรการที่เหมาะสมตามมาตรฐานทั่วไปในอุตสาหกรรมเพื่อปกป้องข้อมูลจากการเข้าถึงโดยไม่ได้รับอนุญาต การสูญหาย หรือการใช้งานที่ไม่เหมาะสม รวมถึงการสื่อสารแบบเข้ารหัสเมื่อจำเป็น อย่างไรก็ตาม ไม่มีระบบใดปลอดภัย 100% — โปรดเก็บรักษารหัสผ่านบัญชีของคุณเป็นความลับ",
              "We apply reasonable industry-standard measures to protect data against unauthorized access, loss, or misuse, including encryption where appropriate. No system is 100% secure—please keep your account credentials confidential."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("4. บุคคลที่สาม", "4. Third parties")}
          </h2>
          <p>
            {t(
              "เราอาจแชร์ข้อมูลที่จำเป็นกับผู้ให้บริการขนส่ง (courier) เพื่อจัดส่งพัสดุ และกับผู้ให้บริการชำระเงิน (payment gateways) เพื่อดำเนินการธุรกรรม เราไม่ขายรายชื่อลูกค้าให้บุคคลที่สามเพื่อการตลาดโดยไม่ได้รับความยินยอมจากคุณ ผู้ให้บริการเหล่านี้มีหน้าที่ประมวลผลข้อมูลตามข้อตกลงกับเราและเพื่อวัตถุประสงค์ที่ระบุเท่านั้น",
              "We may share necessary information with shipping partners to deliver your orders and with payment processors to complete transactions. We do not sell customer lists to third parties for marketing without your consent. These providers process data under agreements with us and only for the purposes described."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("5. คุกกี้ (Cookies)", "5. Cookies")}
          </h2>
          <p>
            {t(
              "เว็บไซต์อาจใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อให้การทำงานพื้นฐานของเว็บ (เช่น การล็อกอิน ตะกร้าสินค้า การตั้งค่าภาษา) และเพื่อปรับปรุงประสบการณ์การใช้งาน คุณสามารถตั้งค่าเบราว์เซอร์ให้ปฏิเสธคุกกี้บางประเภทได้ แต่ฟีเจอร์บางอย่างอาจใช้งานไม่สมบูรณ์",
              "We may use cookies and similar technologies for essential site functions (such as sign-in, cart, or language preferences) and to improve your experience. You can adjust your browser to limit cookies, though some features may not work fully."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("6. สิทธิของคุณ", "6. Your rights")}
          </h2>
          <p>
            {t(
              "คุณมีสิทธิขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณในกรอบที่กฎหมายกำหนด รวมถึงการถอนความยินยอมในการสื่อสารทางการตลาดเมื่อใดก็ได้ หากต้องการใช้สิทธิเหล่านี้ โปรดติดต่อเราผ่านช่องทางที่ระบุบนเว็บไซต์ เราจะตอบกลับภายในระยะเวลาที่สมเหตุสมผล",
              "You may have the right to access, correct, or delete your personal data where applicable law allows, and to withdraw consent for marketing communications at any time. To exercise these rights, contact us via the channels on our website—we will respond within a reasonable period."
            )}
          </p>
        </section>

        <section className="space-y-3 border-t border-zinc-200 pt-8">
          <p className="text-xs text-zinc-500">
            {t(
              "หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว โปรดติดต่อเราผ่านช่องทางที่ระบุบนเว็บไซต์",
              "For questions about this privacy policy, please contact us through the channels listed on our website."
            )}
          </p>
        </section>
      </div>
    </article>
  );
}
