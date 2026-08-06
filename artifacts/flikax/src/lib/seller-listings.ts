import { createPublicClient } from "@/lib/supabase/public";
import { resolveListingImageUrl } from "@/lib/images";
import { isRecentlyBumped } from "@/lib/premium-plans";
import { getListingPath } from "@/lib/listing-url";
import type { ListingCard } from "@/components/listing-grid";

// Data layer for the public seller-store page (/seller/[id]) -- fetches one
// seller's active listings, shaped for ListingGrid same as the homepage/
// category feeds, plus which categories they're actually in (for that
// page's filter row). Sibling to home-listings.ts/category-listings.ts,
// which cover the cross-seller feeds instead.

/** Generous cap, not real pagination -- a single seller's active-listing
 * count is bounded in practice (nowhere near the hundreds a cross-site feed
 * pages through), so one bounded fetch covers the realistic case without
 * building a second infinite-scroll path just for this page. Filtering by
 * category and re-sorting both happen client-side against this same fetch
 * (see SellerStoreListings) rather than round-tripping to the server. */
const SELLER_LISTINGS_LIMIT = 200;

export type SellerCategory = { slug: string; name: string };

/** ListingGrid doesn't need to know which category a card belongs to, so
 * that's not part of the shared ListingCard type -- but this page's filter
 * row does, so it's carried as an extra field on top rather than widening
 * ListingCard (and every other place that builds one) for one consumer. */
export type SellerListingCard = ListingCard & { categorySlug: string };

export type SellerStoreData = {
  listings: SellerListingCard[];
  categories: SellerCategory[];
};

export async function fetchSellerListings(sellerId: string): Promise<SellerStoreData> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, location, is_featured, featured_until, bumped_at, created_at, negotiable, short_id, listing_images(storage_path, position, width, height), categories(slug, name)"
    )
    .eq("user_id", sellerId)
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("bumped_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(SELLER_LISTINGS_LIMIT);

  const rows = data ?? [];
  const now = Date.now();

  const listings: SellerListingCard[] = rows.map((row) => {
    const cover = [...(row.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
    return {
      id: row.id,
      href: getListingPath({
        title: row.title,
        location: row.location,
        short_id: row.short_id,
        categorySlug: row.categories?.slug ?? "listing",
      }),
      title: row.title,
      description: row.description,
      price: row.price,
      location: row.location,
      imageUrl: cover ? resolveListingImageUrl(supabase, cover.storage_path) : null,
      imageWidth: cover?.width,
      imageHeight: cover?.height,
      isFeatured: row.is_featured && (row.featured_until ? new Date(row.featured_until).getTime() > now : false),
      isBumped: isRecentlyBumped(row.bumped_at),
      negotiable: row.negotiable === "yes",
      createdAt: row.created_at,
      categorySlug: row.categories?.slug ?? "listing",
    };
  });

  // Distinct categories this seller actually has an active listing in, in
  // first-seen order -- since `rows` is already featured/bumped/newest
  // first, that also means their most prominent category leads the filter
  // row. Counted in JS rather than a separate GROUP BY query: one seller's
  // listing count is small enough that a second round trip isn't worth it
  // (same reasoning as getTopAttributeValues in category-listings.ts).
  const seen = new Set<string>();
  const categories: SellerCategory[] = [];
  for (const row of rows) {
    const cat = row.categories;
    if (cat && !seen.has(cat.slug)) {
      seen.add(cat.slug);
      categories.push({ slug: cat.slug, name: cat.name });
    }
  }

  return { listings, categories };
}
