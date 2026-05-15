import Image from "next/image";
import Link from "next/link";
import { getArticleBannerForBlog } from "@/services/article-banner-service";
import { getLocalizedPath } from "@/lib/utils";
import { getLatestArticleCampaignBanner } from "@/services/promotion-campaign-service";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import type { MagLocale } from "@/lib/magazine-bilingual";

function ArticleBannerAside({
  desktopSrc,
  mobileSrc,
  alt,
  hrefRaw,
  lang,
}: {
  desktopSrc: string | null;
  mobileSrc: string | null;
  alt: string;
  hrefRaw: string;
  lang: MagLocale;
}) {
  if (!desktopSrc && !mobileSrc) return null;
  const href = getLocalizedPath(hrefRaw.trim() || "/shop", lang);
  return (
    <aside className="mx-auto mt-12 max-w-[720px]" aria-label="Article promotion">
      <Link
        href={href}
        className="group block overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm ring-1 ring-zinc-100 transition hover:border-primary/25 hover:shadow-md"
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-accent/30 md:aspect-[3/1]">
          {mobileSrc ? (
            <Image
              src={mobileSrc}
              alt={alt}
              fill
              sizes="(max-width: 767px) 100vw, 0px"
              className="object-cover transition duration-500 group-hover:scale-[1.02] md:hidden"
              loading="lazy"
              unoptimized={shouldOffloadImageOptimization(mobileSrc)}
            />
          ) : null}
          {desktopSrc ? (
            <Image
              src={desktopSrc}
              alt={alt}
              fill
              sizes="(max-width: 768px) 0px, 720px"
              className="hidden object-cover transition duration-500 group-hover:scale-[1.02] md:block"
              loading="lazy"
              unoptimized={shouldOffloadImageOptimization(desktopSrc)}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
        </div>
      </Link>
    </aside>
  );
}

export async function ArticleCampaignBanner({ lang }: { lang: MagLocale }) {
  let managed: Awaited<ReturnType<typeof getArticleBannerForBlog>> = null;
  try {
    managed = await getArticleBannerForBlog();
  } catch {
    managed = null;
  }
  if (managed) {
    const desktopSrc = managed.desktopImageUrl;
    const mobileSrc = managed.mobileImageUrl ?? desktopSrc;
    return (
      <ArticleBannerAside
        desktopSrc={desktopSrc}
        mobileSrc={mobileSrc}
        alt={managed.titleAlt}
        hrefRaw={managed.destinationUrl}
        lang={lang}
      />
    );
  }

  let campaign: Awaited<ReturnType<typeof getLatestArticleCampaignBanner>> = null;
  try {
    campaign = await getLatestArticleCampaignBanner();
  } catch {
    campaign = null;
  }
  if (!campaign) return null;

  const desktopSrc =
    lang === "en"
      ? campaign.articleBannerEnUrl ?? campaign.articleBannerThUrl
      : campaign.articleBannerThUrl ?? campaign.articleBannerEnUrl;
  const mobileSrc =
    lang === "en"
      ? campaign.articleBannerMobileEnUrl ?? campaign.articleBannerMobileThUrl ?? desktopSrc
      : campaign.articleBannerMobileThUrl ?? campaign.articleBannerMobileEnUrl ?? desktopSrc;

  return (
    <ArticleBannerAside
      desktopSrc={desktopSrc}
      mobileSrc={mobileSrc}
      alt={campaign.breederName ? `Shop ${campaign.breederName}` : campaign.name}
      hrefRaw={campaign.href}
      lang={lang}
    />
  );
}
