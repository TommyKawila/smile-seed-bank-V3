"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function TermsOfUsePage() {
  const { t } = useLanguage();

  return (
    <article className="mx-auto max-w-3xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32">
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        {t("เงื่อนไขการใช้งาน (Terms of Use)", "Terms of Use")}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {t(
          "อัปเดตล่าสุดเพื่อการใช้งานเว็บไซต์และบริการของ Smile Seed Bank",
          "These terms govern your use of the Smile Seed Bank website and services."
        )}
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-700 sm:text-base">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("1. ข้อกำหนดด้านอายุ", "1. Age requirement")}
          </h2>
          <p>
            {t(
              "การเข้าใช้งานเว็บไซต์และการสั่งซื้อสินค้าผ่าน Smile Seed Bank สงวนสำหรับผู้ที่มีอายุครบ 20 ปีบริบูรณ์ขึ้นไปเท่านั้น โดยการใช้บริการ คุณยืนยันว่าคุณมีอายุตามที่กฎหมายกำหนดในประเทศที่คุณอยู่ และยอมรับความรับผิดชอบแต่เพียงผู้เดียวหากข้อมูลดังกล่าวไม่เป็นความจริง",
              "Access to this website and purchases are restricted to individuals who are at least 20 years old. By using our services, you confirm that you meet the minimum legal age in your jurisdiction and accept sole responsibility if that representation is inaccurate."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("2. ข้อจำกัดทางกฎหมายและวัตถุประสงค์การจำหน่าย", "2. Legal disclaimer & intended use")}
          </h2>
          <p>
            {t(
              "เมล็ดพันธุ์ที่จำหน่ายมีวัตถุประสงค์เพื่อเป็นของที่ระลึก (souvenir) การศึกษา หรือการวิจัยที่ชอบด้วยกฎหมายเท่านั้น เราไม่สนับสนุนการปลูกหรือการใช้งานที่ขัดต่อกฎหมายท้องถิ่น ผู้ซื้อมีหน้าที่ศึกษาและปฏิบัติตามกฎหมายที่ใช้บังคับในพื้นที่ของตนเองทุกประการ Smile Seed Bank ไม่รับผิดชอบต่อการใช้สินค้าหลังการจำหน่าย",
              "Seeds are sold as souvenirs, for lawful study, or for research purposes only. We do not encourage cultivation or any use that violates local laws. You are solely responsible for complying with all applicable laws in your region. Smile Seed Bank is not liable for how products are used after purchase."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("3. ความเป็นส่วนตัวและข้อมูลส่วนบุคคล", "3. Privacy & personal data")}
          </h2>
          <p>
            {t(
              "เราเก็บรวบรวมและใช้ข้อมูลที่จำเป็นเพื่อดำเนินการสั่งซื้อ การจัดส่ง การติดต่อสื่อสาร และการปรับปรุงบริการ (เช่น ชื่อ ที่อยู่จัดส่ง อีเมล เบอร์โทร) ตามความจำเป็นและสอดคล้องกับนโยบายความเป็นส่วนตัวของเรา เราไม่ขายข้อมูลของคุณแก่บุคคลที่สามเพื่อการตลาดโดยไม่ได้รับความยินยอมที่ชัดเจน",
              "We collect and use personal information needed to process orders, shipping, customer support, and service improvement (such as name, shipping address, email, and phone) in line with our privacy practices. We do not sell your data to third parties for marketing without clear consent."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
            {t("4. การคืนสินค้าและการยกเลิกออเดอร์", "4. Returns & order cancellation")}
          </h2>
          <p>
            {t(
              "เนื่องจากลักษณะของสินค้าเมล็ดพันธุ์ การคืนสินค้าอาจถูกจำกัดตามนโยบายที่ประกาศบนเว็บไซต์และเงื่อนไขของแต่ละคำสั่งซื้อ โดยทั่วไปสินค้าที่เปิดแล้วหรือไม่อยู่ในสภาพเดิมอาจไม่รับคืน การยกเลิกออเดอร์ก่อนจัดส่งอาจทำได้ตามช่วงเวลาและเงื่อนไขที่กำหนด หากมีข้อพิพาท เราจะพิจารณาตามหลักฉบับย่อของนโยบายลูกค้าที่เกี่ยวข้อง",
              "Due to the nature of seed products, returns may be limited as stated on our website and per order conditions. Opened or non-resalable items may not be eligible for return. Order cancellation before shipment may be available within stated windows and rules. Disputes are handled according to our applicable customer policies."
            )}
          </p>
        </section>

        <section className="space-y-3 border-t border-zinc-200 pt-8">
          <p className="text-xs text-zinc-500">
            {t(
              "หากมีคำถามเกี่ยวกับเงื่อนไขเหล่านี้ โปรดติดต่อเราผ่านช่องทางที่ระบุบนเว็บไซต์",
              "For questions about these terms, please contact us through the channels listed on our website."
            )}
          </p>
        </section>
      </div>
    </article>
  );
}
