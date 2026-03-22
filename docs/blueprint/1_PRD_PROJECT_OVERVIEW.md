# Project Requirements Document (PRD): Smile Seed Bank V3

## 1. Project Overview
**Smile Seed Bank V3** คือระบบจัดการร้านค้าปลีก/ขายส่งเมล็ดพันธุ์ระดับพรีเมียม (Premium Retail/Wholesale Management System for Seeds) โดยทำหน้าที่เป็นตัวแทนจำหน่าย (Distributor) ให้กับแบรนด์ (Breeders) ชั้นนำต่างๆ

**Core Mission:** ระบบจัดการร้านค้าปลีก/ขายส่งเมล็ดพันธุ์ระดับพรีเมียม (Boutique) พร้อมโมดูลหลัก:
- **Advanced Inventory (Genetics/Media):** จัดการสต็อก, สายพันธุ์ (Strain Dominance), และสื่อภาพ (WebP compression)
- **CRM (Tiered Loyalty):** ระบบลูกค้าสัมพันธ์, คะแนนสะสม, ส่วนลดตาม Tier
- **POS (Price Psychology):** สร้างออเดอร์ Manual, ราคาตาม Tier, ใช้คะแนนแลกส่วนลด

เป้าหมายของ V3 คือการวางโครงสร้างที่มั่นคง (Solid Foundation) เพื่อแก้ปัญหาโค้ดซ้อนทับ (Spaghetti Code) พร้อมเพิ่มฟีเจอร์ระดับ ERP ขนาดย่อม เช่น ระบบจัดการลูกค้าขายส่ง (Wholesale), ระบบการเงิน (Financial Dashboard), และระบบ Fulfillment อัตโนมัติ

## 2. Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS, Shadcn UI, Lucide React
- **Animations:** Framer Motion, `tailwindcss-animate`
- **Charts & Data:** Recharts (สำหรับ Admin Dashboard)
- **Email System:** React Email / Resend
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **Version Control:** Git (GitHub)

## 3. Core Objectives
1. **Scalable Architecture:** โครงสร้างต้องรองรับการขยายตัว ไม่เกิดปัญหา Circular Dependency
2. **Omnichannel & B2B:** รองรับออเดอร์จากหน้าเว็บ, ออเดอร์ Manual จากหลังบ้าน พร้อมระบบ Wholesale
3. **Automated Marketing:** มีระบบ Upselling, Free Gift, และ Promo Code อัตโนมัติ ป้องกันการสแปม
4. **Frictionless UX:** ลูกค้าซื้อของง่ายที่สุด Mobile-first, สมัครสมาชิกด้วย Social Login (Google/Line)
5. **AI-Driven Admin:** ใช้ AI ช่วยลดเวลาแอดมินในการสกัดข้อมูลสินค้าและเขียนรีวิว
6. **Financial & Fulfillment:** มี Dashboard สรุปกำไรสุทธิ และระบบพิมพ์ใบปะหน้า/Invoice พร้อมแจ้งเตือนผ่าน Line และ Email