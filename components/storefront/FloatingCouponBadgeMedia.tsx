"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DEFAULT_COUPON_FLOAT_BADGE,
  type FloatingBadgeAsset,
} from "@/lib/coupon-floating-badge";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function FloatingCouponBadgeMedia({ asset }: { asset: FloatingBadgeAsset }) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    if (asset.kind !== "lottie") {
      setAnimationData(null);
      return;
    }
    let cancelled = false;
    void fetch(asset.src)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<object>;
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setAnimationData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [asset.kind, asset.src]);

  if (asset.kind === "lottie") {
    if (animationData) {
      return (
        <div className="pointer-events-none h-9 w-9 shrink-0 overflow-hidden" aria-hidden>
          <Lottie animationData={animationData} loop className="h-9 w-9" />
        </div>
      );
    }
    return (
      <Image
        src={DEFAULT_COUPON_FLOAT_BADGE}
        alt=""
        width={36}
        height={36}
        unoptimized
        loading="lazy"
        className="h-9 w-9 shrink-0 object-contain opacity-70"
      />
    );
  }

  return (
    <Image
      src={asset.src}
      alt=""
      width={36}
      height={36}
      unoptimized={shouldOffloadImageOptimization(asset.src)}
      loading="lazy"
      className="h-9 w-9 shrink-0 object-contain drop-shadow-sm"
    />
  );
}
