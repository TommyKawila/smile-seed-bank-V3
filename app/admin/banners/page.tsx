import { assertAdmin } from "@/lib/auth-utils";
import { getAdminBanners } from "@/services/banner-service";
import { getAdminArticleCampaignBanners } from "@/services/promotion-campaign-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleBannerManagerClient } from "./ArticleBannerManagerClient";
import { BannerManagerClient } from "./BannerManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await assertAdmin();
  const [banners, articleCampaigns] = await Promise.all([
    getAdminBanners(),
    getAdminArticleCampaignBanners(),
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
            Manage home carousel and campaign article banners from one clean workspace.
          </p>
        </div>
        <Tabs defaultValue="home-carousel" className="space-y-5">
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-2 gap-1 bg-zinc-100/90 p-1.5">
            <TabsTrigger
              value="home-carousel"
              className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm sm:text-sm"
            >
              Home Carousel
            </TabsTrigger>
            <TabsTrigger
              value="article-banners"
              className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm sm:text-sm"
            >
              Article Banners
            </TabsTrigger>
          </TabsList>
          <TabsContent value="home-carousel" className="mt-0">
            <BannerManagerClient initialBanners={banners} />
          </TabsContent>
          <TabsContent value="article-banners" className="mt-0">
            <ArticleBannerManagerClient initialCampaigns={articleCampaigns} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
