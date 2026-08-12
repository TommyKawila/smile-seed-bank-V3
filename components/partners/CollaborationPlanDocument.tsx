export const COLLABORATION_PLAN_SHARE_PATH = "/share/green-future/plan";

export function CollaborationPlanDocument() {
  return (
    <article className="space-y-8 text-slate-800">
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Collaboration Plan · GACP Seed Supply
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          แผนงานความร่วมมือทางธุรกิจ
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          โครงการผลิตและจัดจำหน่ายเมล็ดพันธุ์กัญชามาตรฐาน GACP
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">ผู้ร่วมโครงการ</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          <li>
            <span className="font-medium">บริษัท Green Future</span> — ผู้ถือใบอนุญาต
            รวบรวมเมล็ดพันธุ์ควบคุมฯ พ.พ. 3
          </li>
          <li>
            <span className="font-medium">Smile Seed Bank</span> — ผู้ถือใบอนุญาต
            ขายเมล็ดพันธุ์ควบคุมฯ พ.พ. 4
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">เป้าหมายหลัก</h2>
        <p className="text-sm leading-relaxed text-slate-700">
          เพื่อผลิต บรรจุ และจัดจำหน่ายเมล็ดพันธุ์กัญชาที่ถูกต้องตามกฎหมายกรมวิชาการเกษตร
          พร้อมระบบเอกสารตรวจสอบย้อนกลับ (Traceability Pack) แบบดิจิทัล
          เพื่อเจาะกลุ่มลูกค้าฟาร์มกัญชาที่ต้องการนำเมล็ดไปเพาะปลูกและขอรับรองมาตรฐาน
          Thailand Cannabis GACP
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          การแบ่งขอบเขตความรับผิดชอบ
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          แบ่งหน้าที่ตามประเภทใบอนุญาต เพื่อไม่ทับซ้อนทางกฎหมายและให้ทำงานคล่องตัว
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Green Future — ผู้ผลิตและรวบรวม (พ.พ. 3)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              ต้นน้ำ: เพาะพันธุ์จนถึงบรรจุซองปิดผนึก
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed">
              <li>ควบคุมการปลูก ผสมเกสร และเก็บเกี่ยวเมล็ดให้ได้คุณภาพ</li>
              <li>
                ทดสอบอัตราการงอก (Germination) และความบริสุทธิ์ (Purity) ต่อลอต
              </li>
              <li>
                บรรจุลงซอง Smile Seed Bank (ทึบแสง) และติดฉลากตามกฎหมาย —
                ผู้ถือ พ.พ. 4 ไม่แกะแบ่งบรรจุเอง Green Future เป็นผู้บรรจุและซีลเท่านั้น
              </li>
              <li>
                ส่งข้อมูลสายพันธุกรรม (Lineage) และผลทดสอบแต่ละลอตให้ Smile Seed Bank
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Smile Seed Bank — ผู้จัดจำหน่ายและเทคโนโลยี (พ.พ. 4)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              ปลายน้ำ: การตลาดและระบบสนับสนุนลูกค้า GACP
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed">
              <li>
                ขายผ่านเว็บไซต์และหน้าร้าน โดยคงสภาพหีบห่อดั้งเดิมจากผู้ผลิต
              </li>
              <li>
                จัดเตรียมซองบรรจุภัณฑ์และเลย์เอาต์ฉลาก ส่งให้ Green Future ใช้ตอนบรรจุ
              </li>
              <li>
                พัฒนา Traceability Pack Generator ให้ลูกค้าฟาร์มดาวน์โหลด PDF ได้เอง
              </li>
              <li>
                ให้คำแนะนำเบื้องต้นเรื่องเอกสารเมล็ดพันธุ์ประกอบการยื่นขอ GACP
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          ขั้นตอนการปฏิบัติงานร่วมกัน
        </h2>

        <div className="space-y-4">
          <Phase
            n="1"
            title="R&D และการเตรียมการ"
            items={[
              "Smile Seed Bank: รีเสิร์ชความต้องการตลาดฟาร์ม GACP และกำหนดรายชื่อสายพันธุ์ร่วมกับ Green Future",
              "Green Future: ยืนยันความพร้อมแม่พันธุ์/พ่อพันธุ์ และกำหนดตารางเก็บเกี่ยว",
              "ร่วมกัน: สรุปรูปแบบซองและเทมเพลตฉลากตามกฎหมาย (ต้องมีชื่อ/เลขใบอนุญาตของทั้ง 2 ฝ่ายบนฉลาก)",
            ]}
          />
          <Phase
            n="2"
            title="การผลิตและการทดสอบ (Green Future)"
            items={[
              "ปลูก รวบรวม และทำความสะอาดเมล็ด",
              "ทดสอบความงอก (เป้าหมาย >80%) และความบริสุทธิ์ (เป้าหมาย >99%)",
              "บันทึกวันที่รวบรวม วันที่ทดสอบ และวันหมดอายุ",
            ]}
          />
          <Phase
            n="3"
            title="การบรรจุและการส่งมอบ"
            items={[
              "Green Future: พิมพ์ฉลาก (Lot Number) แปะซอง บรรจุเมล็ด ซีลปิดผนึก และจัดส่งสินค้าสำเร็จรูป",
              "Green Future: ส่งมอบ Batch Data (Excel/CSV หรือฟอร์ม) — สายพันธุ์, ผลงอก, ผลความบริสุทธิ์",
            ]}
          />
          <Phase
            n="4"
            title="การจัดจำหน่ายและระบบ GACP (Smile Seed Bank)"
            items={[
              "นำเข้า Batch Data ลงฐานข้อมูล",
              "นำสินค้าขึ้นจำหน่ายบนเว็บไซต์",
              "ลูกค้าฟาร์มกรอก Lot Number แล้วดาวน์โหลด Traceability Pack (PDF) สำหรับยื่นขอ GACP",
            ]}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">บทสรุปสำหรับผู้บริหาร</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          โมเดลนี้ใช้จุดแข็งของทั้งสองฝ่าย Green Future โฟกัสคุณภาพเมล็ดและการเกษตร
          Smile Seed Bank โฟกัส UX ระบบอัตโนมัติ และการตลาด
          ช่วยลดภาระเอกสารให้ลูกค้าฟาร์ม ซึ่งเป็นจุดแข็งที่คู่แข่งตามได้ยาก
        </p>
      </section>
    </article>
  );
}

function Phase({
  n,
  title,
  items,
}: {
  n: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="border-l-2 border-slate-300 pl-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Phase {n}
      </p>
      <h3 className="mt-0.5 text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
