# UI/UX & Design System (V3.2 Premium)

## 1. Color Palette (Eco-Clinical)
- **Primary (Teal):** HSL `162 70% 22%` - แทนที่ Emerald[cite: 7, 8]
- **Secondary (Lavender):** HSL `255 55% 90%` - สำหรับ Indica/Premium sections[cite: 7, 8]
- **Sativa Bar:** HSL `158 95% 45%` (Electric Mint)[cite: 7, 8]
- **Tokens:** ห้ามใช้ HEX ตรงๆ ให้ใช้ `primary`, `secondary`, `accent`[cite: 7, 8]

## 2. Component Standards
- **Hero Banner:** ต้องใช้ `next/image` + `priority={true}` เสมอ[cite: 8]
- **Genetic Bars:** ระบบ Double Glow (Mint สำหรับ Sativa, Lavender สำหรับ Indica)[cite: 7, 8]
- **Border Radius:** `0.75rem` (Modern Rounded)[cite: 7, 8]

## 3. Performance UX
- **Skeleton Loaders:** ต้องมีสำหรับทุกจุดที่โหลดข้อมูลแบบ Dynamic[cite: 8]
- **CLS Prevention:** กำหนด aspect ratio ให้ container รูปภาพทุกจุด[cite: 8]

## 4. Accessibility tokens (V3.2)

Full checklist: `7_A11Y_CHECKLIST.md`

- **Touch:** min **48×48px** interactive · stacked gap **≥8px** (forms **gap-5**)
- **Cards:** **one primary link** per card (stretched link) — no duplicate URL links
- **Focus:** `focus-visible:ring-2 focus-visible:ring-offset-2` on all controls
- **Forms:** label + `id` pair · submit **`min-h-12`**
- **Decorative images on cards:** `alt=""` + `aria-hidden` when CTA is separate