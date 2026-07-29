import { unstable_cache } from "next/cache";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { InfiniteListingGrid } from "@/components/infinite-listing-grid";
import { HeroBanner } from "@/components/hero-banner";
import { HomepageQuickLinks } from "@/components/homepage-quick-links";
import { TopSellers } from "@/components/top-sellers";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { createPublicClient } from "@/lib/supabase/public";
import { getCategories } from "@/lib/categories";
import { fetchHomeListings } from "@/lib/home-listings";
import type { ListingFilters } from "@/lib/filters";
import { loadMoreHomeListingsAction } from "@/app/actions";

const HOME_MAX_LISTINGS = 100;

const VALID_SORTS = ["recommended", "newest", "price_asc", "price_desc"];

export const revalidate = 60;

const getHomeCategoryCounts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("category_counts");
    return data ?? [];
  },
  ["home-category-counts"],
  { revalidate: 60, tags: ["listings"] }
);

const getHomeSearchResults = unstable_cache(
  (filters: ListingFilters) => fetchHomeListings(filters, 1),
  ["home-search-listings"],
  { revalidate: 60, tags: ["listings"] }
);

type PageProps = {
  searchParams: Promise<{
    q?: string;
    location?: string;
    excludeLocation?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: ListingFilters = {
    q: params.q || undefined,
    location: params.location || undefined,
    excludeLocation: params.excludeLocation || undefined,
    category: params.category || undefined,
    minPrice: params.minPrice || undefined,
    maxPrice: params.maxPrice || undefined,
    sort: VALID_SORTS.includes(params.sort ?? "") ? params.sort : undefined,
  };

  const [categories, countRows, { listings, totalCount }] = await Promise.all([
    getCategories(),
    getHomeCategoryCounts(),
    getHomeSearchResults(filters),
  ]);

  const counts = new Map((countRows ?? []).map((row) => [row.category_id, row.listing_count]));

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <SiteHeader categories={categories} />

      {/* 1. Hero promotional carousel — full width, no container constraint */}
      <HeroBanner />

      {/* 2. Quick links row — Post an Ad, Find a Job, Trust & Safety, Premium */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <HomepageQuickLinks />
      </div>

      {/* 3. Main content: sidebar + listing grid */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
        <CategorySidebar
          categories={categories ?? []}
          counts={counts}
          selectedSlug={filters.category}
          filters={filters}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {/* 3a. Listing cards — preserved exactly */}
          <InfiniteListingGrid
            initialListings={listings}
            initialTotalCount={totalCount}
            variant="home"
            loadMore={loadMoreHomeListingsAction.bind(null, filters)}
            maxItems={HOME_MAX_LISTINGS}
          />

          {/* 4. Top sellers this week — bottom-right of listing column, desktop only */}
          <div className="hidden lg:flex lg:justify-end">
            <div className="w-72">
              <TopSellers />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BottomTabBar activeHref="/" />
    </div>
  );
}
