# Project Directory Architecture (App Router)

```text
smile-seed-bank-v3/
├── app/
│   ├── (storefront)/        # หน้าเว็บฝั่งลูกค้า
│   │   ├── page.tsx         # หน้า Home (Hero Section, Bestsellers)
│   │   ├── shop/            # หน้ารวมสินค้า (Filter, Breeder Overlay)
│   │   ├── product/[slug]/  # หน้า Product Details
│   │   ├── cart/            # ตะกร้าสินค้า
│   │   ├── checkout/        # หน้าชำระเงิน
│   │   ├── order-success/   # หน้า Success (แจ้ง Line)
│   │   ├── profile/         # หน้า My Account / Order History
│   │   └── blog/            # หน้า Blog
│   ├── admin/               # ระบบหลังบ้าน
│   │   ├── dashboard/       # กราฟ Analytics (Revenue, Profit, Inventory)
│   │   ├── products/        # จัดการสินค้า + AI Extract
│   │   ├── breeders/        # จัดการแบรนด์
│   │   ├── orders/          
│   │   │   ├── create/      # สร้างออเดอร์ Manual (POS)
│   │   │   └── [id]/print/  # พิมพ์ Invoice, Packing Slip, Shipping Label
│   │   ├── customers/       # จัดการลูกค้า และตั้งค่า Wholesale
│   │   ├── settings/        # อัปโหลด Logo ร้าน / ตั้งค่าอีเมล
│   │   ├── promotions/      # จัดการ Discount, Free Gift, Promo Codes
│   │   └── blogs/           # จัดการบทความ
│   └── api/                 
│       ├── admin/customers/ # CRUD ลูกค้า POS (tier, points, wholesale)
│       ├── admin/inventory/grid/ # Manual Grid products + variants
│       ├── webhooks/        # Line Messaging API
│       └── emails/          # API สำหรับส่ง Email (Resend)
├── components/
│   ├── ui/                  # Shadcn UI Components
│   ├── storefront/          # Components เฉพาะฝั่งลูกค้า
│   ├── admin/               # Components ฝั่งแอดมิน
│   ├── admin/charts/        # Recharts Components (Bar, Line, Pie)
│   └── emails/              # React Email Templates (Order Confirm, Tracking)
├── hooks/                   # Custom Hooks (useCart, useAuth, useProducts)
├── lib/                     
│   ├── supabase/            # Supabase Client & Types
│   ├── bigint-json.ts       # BigInt serialization for API responses (Prisma)
│   └── utils.ts             # Tailwind merge, formatting
├── services/                
│   ├── ai-extractor.ts      # AI extraction + genetic mapping (Indica/Sativa/Hybrid)
│   ├── line-messaging.ts    # Logic สำหรับต่อ Line API
│   └── email-service.ts     # Logic ส่งอีเมล
└── types/                   # TypeScript Interfaces