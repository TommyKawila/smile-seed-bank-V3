# Project Requirements Document (PRD): Smile Seed Bank V3.1

## 1. Project Overview
Smile Seed Bank V3.1 คือระบบจัดการร้านค้าปลีก/ขายส่งเมล็ดพันธุ์ระดับ Boutique พร้อมสถาปัตยกรรมที่เน้น Resilience และ Performance เป็นหัวใจหลัก[cite: 4, 8]

**Core Mission:**
- **Advanced Inventory:** จัดการ Genetics (Photo 3N, Photo FF), สต็อกแบบ Variants[cite: 4, 8]
- **Bilingual Boutique UX:** ระบบ 2 ภาษา (TH/EN) พร้อมดีไซน์ Premium Eco-Clinical
- **Resilient Commerce:** กฎ 2 วินาที (Timeout) และระบบ Error Boundaries ทั่วทั้งแอป

## 2. Tech Stack (V3.1 Standard)
- **Framework:** Next.js 14 (App Router)
- **Architecture:** Strict Service Layer (Separation of Concerns)[cite: 4, 8]
- **Database:** Supabase (PostgreSQL) + Prisma 7[cite: 4, 8]
- **UI:** Shadcn UI + Lucide React + Tailwind (Semantic Tokens)[cite: 4, 7]
- **Resilience:** lib/timeout.ts (withTimeout)[cite: 8]

## 3. Core Objectives
1. **Resilience First:** ระบบต้องไม่ค้างขาว (2-Second Rule) และพังเฉพาะส่วน (Error Boundaries)[cite: 8]
2. **Strict Logic:** ย้าย Business Logic ทั้งหมดไปที่ `services/` ห้ามฝังใน UI[cite: 8]
3. **SEO & Performance:** ใช้ slugs ทุกหน้า, JSON-LD, และ next/image priority สำหรับ LCP[cite: 8]