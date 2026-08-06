import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { SiteHeader } from "@/components/site-header";
import { CategoryPillsRow } from "@/components/category-pills-row";
import { HomeFilterBar } from "@/components/home-filter-bar";
import { InfiniteListingGrid } from "@/components/infinite-listing-grid";
import { HeroBanner } from "@/components/hero-banner";
import { TopSellers } from "@/components/top-sellers";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { JsonLd } from "@/components/seo/json-ld";
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

  const [categories, { listings, totalCount }] = await Promise.all([
    getCategories(),
    getHomeSearchResults(filters),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <JsonLd data={websiteJsonLd} />
      <SiteHeader />

      {/* 1. Static hero band — full width, no container constraint */}
      <HeroBanner />

      {/* 2. Category pills — replaces the old sidebar; sits full-width below the hero */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <CategoryPillsRow categories={categories ?? []} selectedSlug={filters.category} filters={filters} />
      </div>

      {/* A hairline divider between each macro section (categories/listings/top
          sellers) gives the page visible structure instead of everything
          just floating on the same flat background. */}
      <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-neutral-200" />
      </div>

      {/* 3. Main content: filter bar + listing grid, full width now the sidebar is gone */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <HomeFilterBar filters={filters} />

        <InfiniteListingGrid
          initialListings={listings}
          initialTotalCount={totalCount}
          variant="home"
          loadMore={loadMoreHomeListingsAction.bind(null, filters)}
          maxItems={HOME_MAX_LISTINGS}
        />

        {/* 4. Top sellers this week — bottom-right, desktop only */}
        <div className="hidden border-t border-neutral-200 pt-4 lg:flex lg:justify-end">
          <div className="w-72">
            <TopSellers />
          </div>
        </div>
      </main>

      <SiteFooter />
      <BottomTabBar activeHref="/" />
    </div>
  );
}
