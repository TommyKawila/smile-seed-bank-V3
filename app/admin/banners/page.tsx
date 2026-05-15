import { assertAdmin } from "@/lib/auth-utils";
import { getAdminHeroBanners } from "@/services/hero-banner-service";
import { getAdminArticleBanners } from "@/services/article-banner-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleBannerManagerClient } from "./ArticleBannerManagerClient";
import { HeroBannerManagerClient } from "./HeroBannerManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await assertAdmin();
  const [heroBanners, articleBanners] = await Promise.all([
    getAdminHeroBanners(),
    getAdminArticleBanners(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Storefront
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Marketing Hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Manage the home carousel (hero banners) and article promo banners on blog posts.
          </p>
        </div>
        <Tabs defaultValue="home-banners" className="space-y-5">
          <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 gap-1 bg-zinc-100/90 p-1.5">
            <TabsTrigger
              value="home-banners"
              className="rounded-lg px-2 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
            >
              Home banners
            </TabsTrigger>
            <TabsTrigger
              value="article-banners"
              className="rounded-lg px-2 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
            >
              Article banners
            </TabsTrigger>
          </TabsList>
          <TabsContent value="home-banners" className="mt-0">
            <HeroBannerManagerClient initialBanners={heroBanners} />
          </TabsContent>
          <TabsContent value="article-banners" className="mt-0">
            <ArticleBannerManagerClient initialBanners={articleBanners} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
