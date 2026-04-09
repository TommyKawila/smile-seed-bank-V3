import { getLineOaBaseUrl } from "@/lib/line-oa-url";
import { cn } from "@/lib/utils";

export type LineParcelTrackingCtaProps = {
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Minimal LINE OA link. Override via `href`, else `NEXT_PUBLIC_LINE_OA_URL` / `lib/line-oa-url` fallback.
 */
export function LineParcelTrackingCta({ href, className, children }: LineParcelTrackingCtaProps) {
  const url = href?.trim() || getLineOaBaseUrl();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex w-full items-center justify-center rounded-xl border border-[#06C755]/35 bg-white px-3 py-2.5 text-center text-sm font-medium text-[#05804a] transition-colors hover:bg-[#06C755]/[0.06]",
        className
      )}
    >
      {children ?? "ติดตามสถานะพัสดุผ่าน Line"}
    </a>
  );
}
