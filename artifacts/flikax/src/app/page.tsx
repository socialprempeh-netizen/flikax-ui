import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { SiteHeader } from "@/components/site-header";
import { CategorySidebar } from "@/components/category-sidebar";
import { InfiniteListingGrid } from "@/components/infinite-listing-grid";
import { HeroBanner } from "@/components/hero-banner";
import { TopSellers } from "@/components/top-sellers";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { JsonLd } from "@/components/seo/json-ld";
import { createPublicClient } from "@/lib/supabase/public";
import { getCategories } from "@/lib/categories";
import { fetchHomeListings } from "@/lib/home-listings";
import type { ListingFilters } from "@/lib/filters";
import { loadMoreHomeListingsAction } from "@/app/actions";

const HOME_MAX_LISTINGS = 100;

const VALID_SORTS = ["recommended", "newest", "price_asc", "price_desc"];

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Homepage-specific metadata, richer than the generic fallback in the root
// layout -- keyword-relevant title/description and (until a purpose-made
// 1200x630 social card exists) a real photo instead of no image at all, so
// shares of the homepage aren't a blank link preview.
export const metadata: Metadata = {
  title: "Flikax - Buy & Sell Anything in Ghana | Free Classifieds Marketplace",
  description:
    "Ghana's classifieds marketplace. Browse thousands of verified listings for phones, vehicles, property, electronics, fashion and more, or post your own ad free in minutes.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Flikax - Buy & Sell Anything in Ghana",
    description:
      "Browse thousands of verified listings across every category, or post your own ad free in minutes.",
    url: SITE_URL,
    siteName: "Flikax",
    locale: "en_GH",
    type: "website",
    images: [{ url: `${SITE_URL}/images/login-hero.jpg`, width: 1200, height: 630, alt: "Flikax marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flikax - Buy & Sell Anything in Ghana",
    description: "Browse thousands of verified listings, or post your own ad free in minutes.",
    images: [`${SITE_URL}/images/login-hero.jpg`],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Flikax",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

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
      <JsonLd data={websiteJsonLd} />
      <SiteHeader categories={categories} />

      {/* 1. Hero promotional carousel — full width, no container constraint */}
      <HeroBanner />

      {/* 2. Main content: sidebar + listing grid */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-10 pt-3 sm:px-6 sm:pt-4 lg:flex-row lg:gap-8 lg:px-8">
        <CategorySidebar
          categories={categories ?? []}
          counts={counts}
          selectedSlug={filters.category}
          filters={filters}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {/* 2a. Listing cards — preserved exactly */}
          <InfiniteListingGrid
            initialListings={listings}
            initialTotalCount={totalCount}
            variant="home"
            loadMore={loadMoreHomeListingsAction.bind(null, filters)}
            maxItems={HOME_MAX_LISTINGS}
          />

          {/* 3. Top sellers this week — bottom-right of listing column, desktop only */}
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
