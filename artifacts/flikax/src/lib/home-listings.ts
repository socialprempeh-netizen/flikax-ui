import { createPublicClient } from "@/lib/supabase/public";
import { resolveListingImageUrl } from "@/lib/images";
import { isRecentlyBumped } from "@/lib/premium-plans";
import { getListingPath } from "@/lib/listing-url";
import type { ListingFilters } from "@/lib/filters";
import type { ListingCard } from "@/components/listing-grid";

// Rows returned per page by the search_listings RPC (hardcoded in the SQL
// function -- there is no p_page_size parameter to override it).
export const HOME_RPC_PAGE_SIZE = 24;

// Shared by the homepage's initial (cached) server render and the
// uncached "load more" server action used for infinite scroll -- both
// need the exact same RPC-row-to-ListingCard mapping.
export async function fetchHomeListings(
  filters: ListingFilters,
  page: number
): Promise<{ listings: ListingCard[]; totalCount: number }> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("search_listings", {
    search_query: filters.q,
    category_slug: filters.category,
    location_filter: filters.location,
    exclude_location: filters.excludeLocation,
    min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
    max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    p_page: page,
    sort: filters.sort,
  });

  const rows = data ?? [];
  const listings: ListingCard[] = rows.map((listing) => ({
    id: listing.id,
    href: getListingPath({
      title: listing.title,
      location: listing.location,
      short_id: listing.short_id,
      categorySlug: listing.category_slug,
    }),
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    imageUrl: listing.cover_image_path ? resolveListingImageUrl(supabase, listing.cover_image_path) : null,
    imageWidth: listing.cover_image_width,
    imageHeight: listing.cover_image_height,
    isFeatured: listing.is_featured,
    isBumped: isRecentlyBumped(listing.bumped_at),
    negotiable: listing.negotiable === "yes",
    createdAt: listing.created_at,
  }));

  const totalCount = rows[0]?.total_count ?? 0;
  return { listings, totalCount };
}

// Fetches enough RPC pages in parallel to fill `maxItems` listings.
// Used for the homepage SSR initial render so all desired cards arrive in
// one shot rather than requiring the user to scroll through multiple rounds
// of infinite-scroll loads.
//
// Returns `pagesConsumed` so the caller can initialise the infinite-scroll
// page cursor to the correct position (avoiding re-fetching already-loaded
// pages if the user scrolls past the initial batch).
export async function fetchHomeListingsBatch(
  filters: ListingFilters,
  maxItems: number
): Promise<{ listings: ListingCard[]; totalCount: number; pagesConsumed: number }> {
  const pagesNeeded = Math.ceil(maxItems / HOME_RPC_PAGE_SIZE);

  const results = await Promise.all(
    Array.from({ length: pagesNeeded }, (_, i) => fetchHomeListings(filters, i + 1))
  );

  const allListings = results.flatMap((r) => r.listings).slice(0, maxItems);
  const totalCount = results[0]?.totalCount ?? 0;

  // How many full RPC pages were actually consumed (≤ pagesNeeded when
  // totalCount < maxItems and some pages came back empty).
  const pagesConsumed = results.findLastIndex((r) => r.listings.length > 0) + 1 || 1;

  return { listings: allListings, totalCount, pagesConsumed };
}
