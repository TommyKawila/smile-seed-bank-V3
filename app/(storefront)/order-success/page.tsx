"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, ShoppingBag, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LINE_OA_ID = "@smileseedbank"; // ← เปลี่ยนตามร้านจริง

export default function OrderSuccessPage() {
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "—";

  const lineMessage = encodeURIComponent(
    `สวัสดีครับ 🌿 ผมได้สั่งซื้อสินค้าที่ Smile Seed Bank แล้วนะครับ เลขออเดอร์: #${orderNumber}`
  );
  const lineDeepLink = `https://line.me/R/oaMessage/${LINE_OA_ID.replace("@", "")}/?${lineMessage}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Success Card */}
        <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
          {/* Top Green Banner */}
          <div className="bg-primary px-6 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
            >
              <CheckCircle2 className="h-9 w-9 text-white" />
            </motion.div>
            <h1 className="text-xl font-extrabold text-white">สั่งซื้อสำเร็จแล้ว! 🎉</h1>
            <p className="mt-1 text-sm text-white/80">ขอบคุณที่ไว้วางใจ Smile Seed Bank</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Order Number */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                เลขออเดอร์ของคุณ
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-wider text-zinc-900">
                #{orderNumber}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                บันทึกเลขนี้ไว้เพื่อติดตามสถานะ
              </p>
            </div>

            {/* Steps */}
            <ol className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">1</span>
                <span>ทีมงานจะยืนยันออเดอร์ภายใน <strong>24 ชั่วโมง</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">2</span>
                <span>แจ้ง <strong>เลขออเดอร์ #{orderNumber}</strong> ผ่าน Line OA ด้านล่าง</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">3</span>
                <span>รับเลขพัสดุ + ลิงก์ติดตามสินค้าทาง Line</span>
              </li>
            </ol>

            <Separator />

            {/* LINE Button — CTA หลัก */}
            <div className="space-y-2">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
                แจ้งออเดอร์ผ่าน Line OA
              </p>
              <a
                href={lineDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#06C755] py-4 text-base font-bold text-white shadow-lg shadow-[#06C755]/20 transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                {/* Line Logo SVG */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                Add Line & แจ้งออเดอร์
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  #{orderNumber}
                </span>
              </a>
              <p className="text-center text-xs text-zinc-400">
                กดปุ่มด้านบนเพื่อส่งเลขออเดอร์ให้ทีมงานผ่าน Line โดยอัตโนมัติ
              </p>
            </div>

            <Separator />

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="h-10">
                <Link href="/profile">
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  ดูออเดอร์
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link href="/">
                  <Home className="mr-1.5 h-4 w-4" />
                  หน้าแรก
                </Link>
              </Button>
            </div>

            <Button asChild className="w-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
              <Link href="/shop">
                <ShoppingBag className="mr-1.5 h-4 w-4" />
                ช้อปต่อ
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
