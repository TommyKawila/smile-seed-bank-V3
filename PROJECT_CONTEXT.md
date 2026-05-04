# Smile Seed Bank V3.1 — Master Project Context

เอกสารนี้คือ **Context หลักสูงสุด** สำหรับ Engineer และ AI (Cursor/Composer) เพื่อใช้ทำความเข้าใจระบบแบบรวดเร็ว โดยอ้างอิงมาตรฐานจาก `docs/blueprint/` เป็นสำคัญ

---

## 1. Identity & Goals (V3.1 Standard)
- **Positioning:** Premium Retail/Wholesale Seed Bank (Boutique Style)[cite: 8]
- **Design Philosophy:** **Premium Eco-Clinical** (Teal + Lavender) - *เลิกใช้คำว่า Sage/Emerald*
- **Core Mission:** มอบประสบการณ์ซื้อเมล็ดพันธุ์กัญชาแบบ Bilingual (TH/EN) ที่ "เร็ว-อึด-กริบ"[cite: 8]

## 2. Technical Pillars (Blueprint V3.1)
ทุกการเขียนโค้ดต้องยึด 4 เสาหลักนี้[cite: 8]:
1. **Strict Service Layer:** Business Logic ต้องอยู่ใน `services/` เท่านั้น ห้ามฝังใน UI/Components
2. **Resilience (2-Second Rule):** ส่วนเสริม (Related Products, Ads) ต้องใช้ `withTimeout` (2s) เพื่อไม่ให้บล็อก LCP[cite: 8]
3. **LCP Optimization:** รูป Hero/Banner ต้องใช้ `next/image` + `priority={true}`[cite: 8]
4. **Error Boundaries:** ทุกหน้าต้องมี `error.tsx` และ `loading.tsx`[cite: 8]

## 3. Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI[cite: 8]
- **Backend:** Supabase (PostgreSQL, Auth, Storage) + Prisma 7[cite: 8]
- **Resilience Tool:** `lib/timeout.ts` (Universal timeout wrapper)[cite: 8]

## 4. Key Business Logic
- **Stock:** `product_variants.stock` คือ Source of Truth; `products.stock` คือค่า Denormalized สำหรับโชว์หน้าแรก[cite: 8]
- **Pricing:** `products.price` คือราคาเริ่มต้น (Starting from) ที่คำนวณจาก Variant ที่ถูกที่สุดและมีของ[cite: 8]
- **Bilingual:** รองรับ TH/EN ผ่าน `LanguageContext` และคอลัมน์ `*_th` / `*_en`[cite: 8]
- **Wholesale:** ระบบราคาส่งแบบ Tier-based ที่จะ re-validate ทันทีเมื่อลูกค้าเปลี่ยนสถานะ[cite: 8]

## 5. Developer Guidelines
- **AI Scanner:** ระบบสแกนข้อมูลสินค้าแบบ "Read & Discard" (ไม่เก็บรูปต้นฉบับลง Storage)[cite: 8]
- **Surgical Edits:** แก้ไขเฉพาะจุดที่สั่ง ห้าม Refactor ไฟล์ที่ไม่เกี่ยวข้องโดยไม่ได้รับอนุญาต[cite: 8]
- **State Tracking:** อัปเดต `docs/blueprint/6_PROJECT_STATE.md` ทุกครั้งหลังจบ Phase[cite: 8]

---
*Last updated: May 2026 — Aligned with Blueprint V3.1 Architecture*[cite: 8]