export type ArticleBannerAdminRow = {
  id: string;
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  titleAlt: string;
  destinationUrl: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
