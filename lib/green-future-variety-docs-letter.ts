/** Request to GF — variety identity docs for grower GACP applications. Not a PO. */

import { GACP_FEATURED_STRAINS } from "@/lib/gacp-featured-strains";
import { GF_PILOT_STRAIN_CODES } from "@/lib/green-future-pilot-config";

export const GREEN_FUTURE_VARIETY_DOCS_SUBJECT =
  "Request — variety identity documents for grower GACP applications (pilot strains)";

export const GREEN_FUTURE_VARIETY_DOCS_TH_SUBJECT =
  "ขอเอกสารระบุสายพันธุ์ สำหรับคำขอ GACP ของผู้ปลูก (สายนำร่อง)";

const PILOT_LIST = GF_PILOT_STRAIN_CODES.map((code) => {
  const s = GACP_FEATURED_STRAINS.find((x) => x.varietyCode === code);
  return `• ${code} · ${s?.strainName ?? code}`;
}).join("\n");

export const GREEN_FUTURE_VARIETY_DOCS_RAW = `Subject: ${GREEN_FUTURE_VARIETY_DOCS_SUBJECT}

T.M.Y Agro Trade Limited Partnership, trading as Smile Seed Bank
161 Moo 16, Mae Sao, Mae Ai, Chiang Mai 50280, Thailand
To: Green Future (Global) Co., Ltd. · info@greenfuture.global · via Julia
Date: 2 October 2026
Ref. GF/SSB/2026-0907 §5 (GACP authority consultation)

Dear Yevhen, Julia, and the Green Future Team,

This letter is not a purchase order or binding commitment to buy.

We are preparing the grower-side GACP consultation pack. Officers have confirmed that a seed-quality certificate is not enough. They need a variety-identity pack so they can see which named variety is being planted, its traits, and that the genetics are stable.

We already hold a Department of Agriculture Seed Analysis Certificate (Form S.C. 2 1-0 / ม.พ. ๒ ๑-๐), sample AF22. That form records germination, purity and moisture only. It is not a variety document.

Officers have indicated that, under Thailand Cannabis GACP Clause 8 (seeds and propagating material), a GACP seed producer is expected to keep variety-development history and variety characteristics as internal quality control, and may issue this pack itself (self-certification) to downstream farms for their authority file.

Please issue the pack below on Green Future company letterhead, with company stamp, dated, and signed by the breeder or the QA manager, for each of these five pilot varieties:

${PILOT_LIST}

Lot number may be completed per dispatched lot so it matches the sealed pouch. If a lot is not yet assigned, please issue the variety pack now and confirm that the lot line will be filled at packing.

---

Part 1 — Breeder’s Certificate / Certificate of Genetic Origin (one page per variety)

1. Header: company name, site address, and the producer’s GACP certificate number
2. Statement of guarantee: that the named cannabis variety, for the stated production lot, was bred and produced under Green Future’s GACP system
3. Lineage / parentage: mother × father (or equivalent origin record)
4. Stability statement: that the variety has been tested for genetic stability (please state generations, if recorded) with a low off-type rate
5. Sign-off: date, authorised signature, company stamp

---

Part 2 — Variety Identification Sheet / Technical Data Sheet (1–2 pages per variety, with real photographs where available)

Botanical characteristics
• Plant habit (e.g. compact bush / tall open)
• Leaf (Indica-broad / Sativa-narrow, typical leaflet count)
• Flower / inflorescence (shape, colour notes, trichome density)

Agronomic traits
• Flowering time (weeks)
• Notable disease or heat tolerance, if recorded

Chemical / cannabinoid profile (indicative, as you record it)
• Typical THC / CBD (e.g. THC 18–22%, CBD < 1%)

Photographs should be sufficient for an inspector to compare plants in the field with the sheet.

---

Optional — plant-variety registration (กรมวิชาการเกษตร)

If any of these five varieties is registered with the Department of Agriculture Plant Variety Protection Office (ฉ.พ.๒ / Plant Variety Act B.E. 2518), please attach a copy of the registration certificate. Officers have said this carries high weight when filed together with Green Future’s own pack. If none are registered, a short written confirmation of that fact is still useful.

---

Please do not send only the Seed Analysis Certificate or Package A/B (purity + germination, optionally moisture) in place of Parts 1–2. Those remain quality documents.

We will use the files only for the grower GACP authority file and will not republish them without your prior written consent.

Thank you.

Prepared by Smile Seed Bank / T.M.Y Agro Trade Limited Partnership
www.smileseedbank.com
`;

export const GREEN_FUTURE_VARIETY_DOCS_TH_RAW = `Subject: ${GREEN_FUTURE_VARIETY_DOCS_TH_SUBJECT}

หจก. ทีเอ็มวาย อะโกร เทรด ภายใต้แบรนด์ Smile Seed Bank
161 หมู่ 16 แม่สาว แม่อาย เชียงใหม่ 50280
ถึง: Green Future (Global) Co., Ltd. · info@greenfuture.global · ผ่านคุณจูเลีย
วันที่: 2 ตุลาคม 2569
อ้างอิง GF/SSB/2026-0907 ข้อ 5 (ปรึกษาหน่วยงาน GACP)

เรียน คุณเยฟเฮน คุณจูเลีย และทีม Green Future

จดหมายฉบับนี้ไม่ใช่ใบสั่งซื้อหรือคำมั่นผูกพันในการซื้อ

เรากำลังจัดแฟ้มปรึกษาหน่วยงานฝั่งผู้ปลูก เจ้าหน้าที่ยืนยันว่าใบคุณภาพเมล็ดอย่างเดียวไม่พอ ต้องการชุดเอกสารระบุสายพันธุ์ เพื่อพิสูจน์ว่าเมล็ดที่นำไปปลูกเป็นสายที่มีชื่อ มีลักษณะเด่น และพันธุกรรมนิ่ง

เรามีใบรับรองคุณภาพเมล็ดพันธุ์ของกรมวิชาการเกษตรแล้ว (แบบ ม.พ. ๒ ๑-๐ / Form S.C. 2 1-0) ตัวอย่าง AF22 ใบนี้บอกแค่งอก บริสุทธิ์ และความชื้น ไม่ใช่เอกสารระบุสายพันธุ์

เจ้าหน้าที่ระบุว่า ตามมาตรฐาน Thailand Cannabis GACP ข้อ 8 (เมล็ดพันธุ์และส่วนขยายพันธุ์) ผู้ผลิตวัสดุขยายพันธุ์ที่ได้รับรอง GACP ต้องบันทึกประวัติการพัฒนาสายพันธุ์และลักษณะประจำพันธุ์เป็นระบบควบคุมคุณภาพภายใน และสามารถออกเอกสารนี้เอง (self-certification) ให้ฟาร์มปลายทางนำไปยื่นได้

กรุณาออกชุดด้านล่างบนหัวจดหมายบริษัท Green Future มีตราประทับ ลงวันที่ และเซ็นโดยนักปรับปรุงพันธุ์หรือผู้จัดการฝ่ายควบคุมคุณภาพ สำหรับ 5 สายนำร่อง:

${PILOT_LIST}

เลขล็อตกรอกตามล็อตที่บรรจุให้ตรงซองซีลได้ หากยังไม่มีล็อต กรุณาออกชุดรายสายก่อน แล้วยืนยันว่าจะใส่เลขล็อตตอนบรรจุ

---

ส่วนที่ 1 — ใบรับรองประวัติสายพันธุ์ (Breeder’s Certificate / Certificate of Genetic Origin) หน้าเดียวต่อสาย

1. Header: ชื่อโรงงาน ที่ตั้ง และเลขที่ใบรับรอง GACP ของสถานที่ผลิต
2. ข้อความรับรอง: ว่าเมล็ดกัญชาสายพันธุ์ที่ระบุ ล็อตที่ระบุ ได้รับการปรับปรุงพันธุ์และผลิตภายใต้ระบบ GACP ของบริษัทจริง
3. สายเลือดพันธุ์ (Lineage / Parentage): ต้นแม่ × ต้นพ่อ หรือบันทึกกำเนิดที่เทียบเท่า
4. ข้อความยืนยันความนิ่ง (Stability): ว่าผ่านการทดสอบเสถียรภาพทางพันธุกรรม (ระบุจำนวนเจเนอเรชันถ้ามีบันทึก) อัตราความเพี้ยนต่ำ
5. ลงนาม: วันที่ ลายเซ็นผู้มีอำนาจ และตราประทับบริษัท

---

ส่วนที่ 2 — แผ่นข้อมูลลักษณะประจำพันธุ์ (Variety Identification Sheet / Technical Data Sheet) ประมาณ 1–2 หน้าต่อสาย ควรมีรูปถ่ายจริง

ลักษณะทางพฤกษศาสตร์
• รูปทรงต้น (เช่น ทรงพุ่มหนา / ทรงสูงโปร่ง)
• ลักษณะใบ (ใบกว้างสไตล์ Indica / ใบเรียวสไตล์ Sativa จำนวนแฉกโดยเฉลี่ย)
• ลักษณะดอก/ช่อดอก (รูปทรง สี ความหนาแน่นไตรโคม)

พฤติกรรมการปลูก
• ระยะเวลาทำดอก (สัปดาห์)
• ความต้านทานโรคหรือความร้อน ถ้ามีบันทึก

ข้อมูลเคมีเบื้องต้น (ตามที่โรงงานบันทึก)
• ค่าเฉลี่ยสารสำคัญ เช่น THC 18–22%, CBD < 1%

รูปควรใช้เทียบเคียงตอนเจ้าหน้าที่ลงตรวจฟาร์มได้

---

ทางเลือกเสริม — หนังสือรับรองพันธุ์พืชขึ้นทะเบียน (กรมวิชาการเกษตร)

หากสายใดใน 5 สายขึ้นทะเบียนกับสำนักคุ้มครองพันธุ์พืช กรมวิชาการเกษตรแล้ว (ฉ.พ.๒ / พ.ร.บ. พันธุ์พืช พ.ศ. 2518) กรุณาแนบสำเนาใบขึ้นทะเบียน คู่กับชุดที่โรงงานออกเอง เจ้าหน้าที่ระบุว่าเอกสารนี้มีน้ำหนักสูง หากไม่มีทั้งหมด การยืนยันเป็นลายลักษณ์อักษรถือว่ามีประโยชน์

---

กรุณาอย่าส่งเฉพาะใบรับรองคุณภาพเมล็ดพันธุ์ หรือ Package A/B (บริสุทธิ์ + งอก และความชื้นถ้ามี) แทนส่วนที่ 1–2 เอกสารเหล่านั้นยังเป็นเอกสารคุณภาพ

เราจะใช้ไฟล์เฉพาะแฟ้มหน่วยงาน GACP ของผู้ปลูก และจะไม่เผยแพร่โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรก่อน

ขอบคุณครับ

จัดทำโดย Smile Seed Bank / หจก. ทีเอ็มวาย อะโกร เทรด
www.smileseedbank.com
`;
