import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Metadata } from "next";
import {
  Star,
  TrendingUp,
  Eye,
  MessageSquareWarning,
  CheckCircle2,
  Sparkles,
  Settings2,
  Home as HomeIcon,
  Sofa,
  HardDrive,
  Tag,
  Layers,
  BadgeCheck,
  Store,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveListingImageUrl } from "@/lib/images";
import { isRecentlyBumped } from "@/lib/premium-plans";
import { getFieldsForCategory, HEADLINE_FIELD_KEYS } from "@/lib/listing-fields";
import { formatAttributeValue } from "@/lib/format-attribute-value";
import { formatRelativeTime } from "@/lib/format-time";
import { getListingPath, extractShortIdFromSlug } from "@/lib/listing-url";
import {
  fetchCategoryListings,
  getTopAttributeValues,
  countCategoryListings,
  getChildCategoryIds,
  parseAttributeFilters,
  MIN_INDEXABLE_LISTINGS,
  type CategoryIdFilter,
  type CategorySort,
  type DatePosted,
} from "@/lib/category-listings";
import { getSidebarFields, getTopLevelDisplayFields, getQuickFilterKey } from "@/lib/category-filters";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SellCta } from "@/components/cta/sell-cta";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { SaveListingButton } from "@/components/listings/save-listing-button";
import { RevealPhoneButton } from "@/components/listings/reveal-phone-button";
import { ContactSellerActions } from "@/components/listings/contact-seller-actions";
import { ListingOwnerActions } from "@/components/listings/listing-owner-actions";
import { ShareButtons } from "@/components/listings/share-buttons";
import { ListingGrid, type ListingCard } from "@/components/listing-grid";
import { InfiniteListingGrid } from "@/components/infinite-listing-grid";
import { CategoryFilterRow } from "@/components/category-filter-row";
import { CategorySidebarFilters } from "@/components/category-sidebar-filters";
import { CategoryQuickFilters } from "@/components/category-quick-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackRecentlyViewed } from "@/components/track-recently-viewed";
import { AvatarContent } from "@/components/avatar-content";
import { loadMoreCategoryListingsAction } from "@/app/[category]/actions";

// Only actually applies to the listing-detail branch of this route (the
// location-scoped listing branch reads searchParams for sort/date filters,
// which forces it dynamic regardless of this export -- see CategoryLocationPage).
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const SIMILAR_LIMIT = 8;
const VALID_SORTS: CategorySort[] = ["recommended", "newest", "price_asc", "price_desc"];
const VALID_DATE_POSTED: DatePosted[] = ["24h", "7d", "30d"];

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

const FIELD_ICONS: Record<string, LucideIcon> = {
  condition: Sparkles,
  transmission: Settings2,
  property_type: HomeIcon,
  furnished: Sofa,
  storage: HardDrive,
  brand: Tag,
  material: Layers,
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  sold: "Sold",
  removed: "Unavailable",
  declined: "Declined",
};

const SAFETY_TIPS = [
  "Verify seller identity for high-value items before sharing any details.",
  "Inspect vehicles and high-cost items thoroughly in daylight before finalizing payment.",
  "Do not send prepayments under any circumstances.",
  "Conduct meetings for viewing and transactions only in public, safe areas during daytime.",
  "Ensure all necessary ownership and registration documents are complete and authentic.",
];

type CategoryRow = { id: string; name: string; slug: string; parent_id: string | null };
type LocationRow = { district_name: string; district_slug: string };

type Route =
  | { kind: "location"; category: CategoryRow; location: LocationRow }
  | { kind: "listing"; shortId: number }
  | { kind: "not-found" };

type PageParams = { category: string; slug: string };
// attr_<fieldKey>/attr_<fieldKey>_min/_max are dynamic per category (see
// category-filters.ts) so this stays a loose string map rather than naming every key.
type CategoryLocationSearchParams = { [key: string]: string | undefined };
type PageProps = { params: Promise<PageParams>; searchParams: Promise<CategoryLocationSearchParams> };

// A category slug that doesn't resolve to a real category (leaf or top-level)
// is never valid, regardless of what the second segment looks like — checked
// first so a typo'd category can't accidentally fall through to a
// coincidental short-id decode.
const resolveRoute = cache(async (categorySlug: string, slug: string): Promise<Route> => {
  const supabase = createPublicClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return { kind: "not-found" };

  const { data: location } = await supabase
    .from("locations")
    .select("district_name, district_slug")
    .eq("district_slug", slug)
    .eq("enabled", true)
    .is("suburb_slug", null)
    .maybeSingle();

  if (location) return { kind: "location", category, location };

  const shortId = extractShortIdFromSlug(slug);
  if (shortId === null) return { kind: "not-found" };
  return { kind: "listing", shortId };
});

// cache() dedupes repeat calls within a single request; unstable_cache is
// what actually persists the result *across* requests for up to 60s, so a
// burst of views on the same listing shares one Supabase round-trip instead
// of one each. Tagged "listings" so create/update/delete actions can purge
// it immediately via revalidateTag instead of waiting out the 60s window.
const getListingByShortId = cache(async (shortId: number) => {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      // contact_phone and profiles.phone are deliberately excluded here: this
      // result is cached and shared across every viewer for 60s (see
      // unstable_cache below), so anything caller-specific or otherwise
      // access-controlled can't safely live in it. Both are fetched
      // separately per-request in ListingDetail via the RPCs that actually
      // enforce who gets to see them.
      const { data } = await supabase
        .from("listings")
        .select(
          "id, user_id, category_id, title, description, price, original_price, is_discounted, location, status, created_at, updated_at, attributes, negotiable, video_url, is_featured, featured_until, views, bumped_at, short_id, categories(id, name, slug, parent_id), listing_images(storage_path, position, width, height), profiles(full_name, verified, avatar_url)"
        )
        .eq("short_id", shortId)
        .maybeSingle();
      return data;
    },
    ["listing-by-short-id", String(shortId)],
    { revalidate: 60, tags: ["listings"] }
  )();
});

function listingPath(listing: { title: string; location: string; short_id: number; categories: { slug: string } | null }) {
  return getListingPath({
    title: listing.title,
    location: listing.location,
    short_id: listing.short_id,
    categorySlug: listing.categories?.slug ?? "listing",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const route = await resolveRoute(categorySlug, slug);

  if (route.kind === "not-found") return {};

  if (route.kind === "location") {
    const supabase = createPublicClient();
    // Same aggregation as the page body below: a top-level category + location (e.g.
    // /vehicles/accra) counts listings across its leaves too, not just ones tagged to
    // the top-level category itself, or a real page could get wrongly marked noindex.
    const childIds = route.category.parent_id ? [] : await getChildCategoryIds(supabase, route.category.id);
    const categoryIds: CategoryIdFilter = childIds.length > 0 ? [route.category.id, ...childIds] : route.category.id;
    const count = await countCategoryListings(supabase, categoryIds, route.location.district_name);
    const title = `${route.category.name} for Sale in ${route.location.district_name} | Flikax`;
    const description = `Browse ${route.category.name} listings in ${route.location.district_name}, Ghana on Flikax — Ghana's classifieds marketplace.`;
    return {
      title,
      description,
      alternates: { canonical: `/${categorySlug}/${slug}` },
      robots: count < MIN_INDEXABLE_LISTINGS ? { index: false, follow: true } : undefined,
    };
  }

  const listing = await getListingByShortId(route.shortId);
  if (!listing) return {};

  const supabase = createPublicClient();
  const cover = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
  const imageUrl = cover ? resolveListingImageUrl(supabase, cover.storage_path) : undefined;
  // Explicit width/height (when the upload tracked them) let social crawlers
  // render the preview card without having to fetch and probe the image
  // themselves first -- a common cause of a missing/late-appearing preview.
  const ogImage = imageUrl
    ? { url: imageUrl, width: cover?.width ?? 1200, height: cover?.height ?? 900, alt: listing.title }
    : undefined;
  const title = `${listing.title} for Sale in ${listing.location} | Flikax Ghana`;
  const priceLabel = currency.format(listing.price);
  const description = listing.description
    ? `${priceLabel} in ${listing.location}. ${listing.description.slice(0, 150)}`
    : `${priceLabel} in ${listing.location}. Buy and sell on Flikax, Ghana's classifieds marketplace.`;
  const canonicalPath = listingPath(listing);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "Flikax",
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function CategoryOrListingPage({ params, searchParams }: PageProps) {
  const { category: categorySlug, slug } = await params;
  const route = await resolveRoute(categorySlug, slug);

  if (route.kind === "not-found") notFound();

  if (route.kind === "location") {
    return <CategoryLocationPage category={route.category} location={route.location} searchParams={searchParams} />;
  }

  const listing = await getListingByShortId(route.shortId);
  if (!listing) notFound();

  const canonicalPath = listingPath(listing);
  if (canonicalPath !== `/${categorySlug}/${slug}`) {
    permanentRedirect(canonicalPath);
  }

  return <ListingDetail listing={listing} />;
}

async function CategoryLocationPage({
  category,
  location,
  searchParams,
}: {
  category: CategoryRow;
  location: LocationRow;
  searchParams: Promise<CategoryLocationSearchParams>;
}) {
  const supabase = createPublicClient();
  const rawParams = await searchParams;
  const { sort: sortParam, posted } = rawParams;
  const sort: CategorySort = VALID_SORTS.includes(sortParam as CategorySort)
    ? (sortParam as CategorySort)
    : "recommended";
  const datePosted: DatePosted | undefined = VALID_DATE_POSTED.includes(posted as DatePosted)
    ? (posted as DatePosted)
    : undefined;

  // Same leaf-vs-top-level branching as [category]/page.tsx: a leaf's own slug is
  // the more specific key, on top of its parent's; a top-level category (parent_id
  // null, e.g. browsing "vehicles" itself by location) has no parent to look up and
  // no leaf-level override -- its own slug *is* the top-level slug.
  const parentCategory = category.parent_id
    ? await supabase
        .from("categories")
        .select("name, slug")
        .eq("id", category.parent_id)
        .maybeSingle()
        .then((r) => r.data)
    : null;
  const topLevelSlug = category.parent_id ? parentCategory?.slug : category.slug;
  const leafSlug = category.parent_id ? category.slug : undefined;
  const sidebarFields = getSidebarFields(topLevelSlug, leafSlug);
  const displayFields = leafSlug ? sidebarFields : getTopLevelDisplayFields(topLevelSlug);
  const quickFilterKey = getQuickFilterKey(topLevelSlug, leafSlug);

  const { attributeFilters, verifiedOnly, discountOnly } = parseAttributeFilters(sidebarFields, rawParams);
  const activeQuickFilterValue = quickFilterKey ? rawParams[`attr_${quickFilterKey}`] : undefined;

  // Same aggregation as [category]/page.tsx -- a top-level category + location (e.g.
  // /vehicles/accra) shows listings from every leaf under it too.
  const childIds = category.parent_id ? [] : await getChildCategoryIds(supabase, category.id);
  const categoryIds: CategoryIdFilter = childIds.length > 0 ? [category.id, ...childIds] : category.id;

  const listingsFilter = {
    categoryId: categoryIds,
    location: location.district_name,
    sort,
    datePosted,
    verifiedOnly,
    discountOnly,
    attributeFilters,
  };

  const [{ listings, totalCount }, quickFilterValues] = await Promise.all([
    fetchCategoryListings(supabase, { ...listingsFilter, page: 1 }),
    quickFilterKey ? getTopAttributeValues(supabase, categoryIds, quickFilterKey) : Promise.resolve([]),
  ]);

  const belowThreshold = totalCount < MIN_INDEXABLE_LISTINGS;

  const carryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "page" || !value) continue;
    carryParams.set(key, value);
  }

  const breadcrumbItems = [
    { name: "Home", item: SITE_URL },
    ...(parentCategory ? [{ name: parentCategory.name, item: `${SITE_URL}/${parentCategory.slug}` }] : []),
    { name: category.name, item: `${SITE_URL}/${category.slug}` },
    { name: location.district_name, item: `${SITE_URL}/${category.slug}/${location.district_slug}` },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <JsonLd data={breadcrumbJsonLd} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
          <Link href="/" className="flex min-h-11 min-w-11 items-center hover:text-brand">
            Home
          </Link>
          {parentCategory && (
            <>
              <span>/</span>
              <Link href={`/${parentCategory.slug}`} className="flex min-h-11 min-w-11 items-center hover:text-brand">
                {parentCategory.name}
              </Link>
            </>
          )}
          <span>/</span>
          <Link href={`/${category.slug}`} className="flex min-h-11 min-w-11 items-center hover:text-brand">
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-neutral-700">{location.district_name}</span>
        </div>

        <h1 className="mb-6 border-l-4 border-brand pl-3 text-xl font-bold text-neutral-800">
          {category.name} for Sale in {location.district_name}
        </h1>

        {belowThreshold ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-white py-16 text-center">
            <p className="text-sm font-medium text-neutral-600">
              No {category.name} listings in {location.district_name} yet.
            </p>
            <Link href={`/${category.slug}`} className="text-sm font-bold text-brand hover:underline">
              Browse {category.name} nationwide
            </Link>
          </div>
        ) : (
          <div className="flex gap-4">
            <CategorySidebarFilters
              categorySlug={category.slug}
              fields={displayFields}
              activeLocationSlug={location.district_slug}
            />

            <div className="min-w-0 flex-1">
              {quickFilterKey && (
                <CategoryQuickFilters
                  items={quickFilterValues}
                  topLevelSlug={topLevelSlug}
                  leafSlug={leafSlug}
                  attributeKey={quickFilterKey}
                  activeValue={activeQuickFilterValue}
                  baseHref={`/${category.slug}/${location.district_slug}`}
                  currentQuery={carryParams}
                />
              )}

              <div className="mb-4">
                <CategoryFilterRow sort={sort} datePosted={datePosted} totalCount={totalCount} />
              </div>

              <InfiniteListingGrid
                initialListings={listings}
                initialTotalCount={totalCount}
                loadMore={loadMoreCategoryListingsAction.bind(null, listingsFilter)}
              />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

type ListingRow = NonNullable<Awaited<ReturnType<typeof getListingByShortId>>>;

async function ListingDetail({ listing }: { listing: ListingRow }) {
  // Security-sensitive, and deliberately isolated: a non-active (sold/
  // removed) listing is only visible to its own owner. getUser() is only
  // called for that rare branch -- for the hot path (an active listing,
  // the overwhelming majority of views), this render never touches
  // cookies(), which is what keeps that path cache-eligible. Ownership for
  // the *active*-listing UI (Mark Unavailable, hiding "Message Seller" from
  // yourself, etc.) is resolved client-side instead -- see
  // ContactSellerActions/ListingOwnerActions.
  // Cookie-scoped client only fetched for the non-active branch (owner
  // viewing their own sold/removed listing) -- get_listing_contact_phone
  // needs a real auth.uid() there, but calling createClient() (and its
  // cookies()) on the active-listing hot path would kill this render's
  // cache-eligibility, per the comment above. createClient() is memoized
  // per request, so this doesn't duplicate the client getUser() already built.
  let ownerScopedClient: Awaited<ReturnType<typeof createClient>> | null = null;
  if (listing.status !== "active") {
    const { data: userData } = await getUser();
    if (userData.user?.id !== listing.user_id) notFound();
    ownerScopedClient = await createClient();
  }

  const supabase = createPublicClient();

  const [{ data: sellerContactPhone }, { data: sellerProfileRows }] = await Promise.all([
    (ownerScopedClient ?? supabase).rpc("get_listing_contact_phone", { p_listing_id: listing.id }),
    supabase.rpc("get_public_seller_profile", { p_user_id: listing.user_id }),
  ]);
  const sellerProfile = sellerProfileRows?.[0] ?? null;

  const images = [...(listing.listing_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((img) => resolveListingImageUrl(supabase, img.storage_path));

  const category = listing.categories;

  const currentPath = getListingPath({
    title: listing.title,
    location: listing.location,
    short_id: listing.short_id,
    categorySlug: category?.slug ?? "listing",
  });

  const [parentResult, similarSameLocationResult] = await Promise.all([
    category?.parent_id
      ? supabase.from("categories").select("name, slug").eq("id", category.parent_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("listings")
      .select(
        "id, title, price, original_price, is_discounted, seller_verified, location, is_featured, featured_until, bumped_at, listing_images(storage_path, position, width, height), categories(slug), short_id"
      )
      .eq("category_id", listing.category_id)
      .eq("status", "active")
      .eq("location", listing.location)
      .neq("id", listing.id)
      .order("created_at", { ascending: false })
      .limit(SIMILAR_LIMIT),
  ]);

  const parentCategory = parentResult.data as { name: string; slug: string } | null;
  const topLevelSlug = parentCategory?.slug ?? category?.slug;

  const fields = getFieldsForCategory(topLevelSlug ?? undefined, category?.slug);
  const attributes = (listing.attributes ?? {}) as Record<string, string | string[]>;

  const allSpecs = fields
    .filter((field) => field.type !== "tags")
    .map((field) => {
      const raw = attributes[field.key] as string | undefined;
      // Make/brand specifically: sellers sometimes type "2026 Cadillac" or "toyota" --
      // clean those up for display without touching fields where casing is meaningful
      // (a VIN, an engine size like "3000cc") or that aren't free text at all.
      const value = raw && (field.key === "make" || field.key === "brand") ? formatAttributeValue(raw) : raw;
      return { key: field.key, label: field.label, value };
    })
    .filter((spec) => spec.value);

  const tagSpecs = fields
    .filter((field) => field.type === "tags")
    .map((field) => ({
      key: field.key,
      label: field.label,
      values: (attributes[field.key] as string[] | undefined) ?? [],
    }))
    .filter((spec) => spec.values.length > 0);

  const headlineKeys = topLevelSlug ? (HEADLINE_FIELD_KEYS[topLevelSlug] ?? []) : [];
  const headlineSpecs = allSpecs.filter((spec) => headlineKeys.includes(spec.key));
  // The full spec grid below shouldn't repeat whatever's already shown as a
  // headline badge right under the price.
  const specs = allSpecs.filter((spec) => !headlineKeys.includes(spec.key));

  const make = attributes.make as string | undefined;

  // Ownership is no longer known server-side for an active listing (see
  // above) -- the previous "don't count the owner's own view" exclusion
  // isn't checkable here anymore. Counting it unconditionally very slightly
  // inflates a listing's own-owner view count, a materially smaller cost
  // than reintroducing a per-viewer cookies() check into this hot path.
  after(() => supabase.rpc("increment_listing_views", { listing_id: listing.id }));

  let similarRows = similarSameLocationResult.data ?? [];

  if (similarRows.length < SIMILAR_LIMIT) {
    const excludeIds = [listing.id, ...similarRows.map((r) => r.id)];
    const { data: similarAnyLocation } = await supabase
      .from("listings")
      .select(
        "id, title, price, original_price, is_discounted, seller_verified, location, is_featured, featured_until, bumped_at, listing_images(storage_path, position, width, height), categories(slug), short_id"
      )
      .eq("category_id", listing.category_id)
      .eq("status", "active")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(SIMILAR_LIMIT - similarRows.length);
    similarRows = [...similarRows, ...(similarAnyLocation ?? [])];
  }

  const now = Date.now();
  const similarListings: ListingCard[] = similarRows.map((row) => {
    const cover = [...(row.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
    return {
      id: row.id,
      href: listingPath(row),
      title: row.title,
      price: row.price,
      originalPrice: row.is_discounted ? row.original_price : null,
      location: row.location,
      imageUrl: cover ? resolveListingImageUrl(supabase, cover.storage_path) : null,
      imageWidth: cover?.width,
      imageHeight: cover?.height,
      isFeatured: row.is_featured && (row.featured_until ? new Date(row.featured_until).getTime() > now : false),
      isBumped: isRecentlyBumped(row.bumped_at),
      isVerifiedSeller: row.seller_verified,
    };
  });

  const isFeatured =
    listing.is_featured && (!listing.featured_until || new Date(listing.featured_until) > new Date());
  const isBumped = isRecentlyBumped(listing.bumped_at);

  const sellerName = sellerProfile?.full_name || listing.profiles?.full_name || "Flikax user";
  const sellerPhoneDigits = sellerContactPhone?.replace(/^\+/, "");
  const sellerPhone = sellerPhoneDigits ? `+${sellerPhoneDigits}` : null;
  const feedbackHref = `/feedback?listingId=${encodeURIComponent(listing.id)}`;

  const canonicalListingPath = listingPath(listing);
  const isVehicle = topLevelSlug === "vehicles";
  const brandName = isVehicle ? make : (attributes.brand as string | undefined);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": isVehicle ? "Vehicle" : "Product",
    name: listing.title,
    description: listing.description || undefined,
    image: images.length > 0 ? images : undefined,
    url: `${SITE_URL}${canonicalListingPath}`,
    ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "GHS",
      availability:
        listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}${canonicalListingPath}`,
    },
  };

  const breadcrumbItems = [
    { name: "Home", item: SITE_URL },
    ...(parentCategory ? [{ name: parentCategory.name, item: `${SITE_URL}/${parentCategory.slug}` }] : []),
    ...(category ? [{ name: category.name, item: `${SITE_URL}/${category.slug}` }] : []),
    { name: listing.title, item: `${SITE_URL}${canonicalListingPath}` },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* Rendered directly (not via the metadata.other API) because Next.js
          emits `other` fields as <meta name="..."> -- the OG product
          namespace is only recognized by Facebook/WhatsApp/etc. crawlers
          via the RDFa `property` attribute, same as the rest of Open Graph.
          Next.js hoists any <meta>/<title>/<link> rendered from a Server
          Component's tree into <head> regardless of where it's rendered, so
          this works exactly like the metadata export does. */}
      <meta property="product:price:amount" content={String(listing.price)} />
      <meta property="product:price:currency" content="GHS" />
      <meta property="product:availability" content={listing.status === "active" ? "in stock" : "out of stock"} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
          <Link href="/" className="flex min-h-11 min-w-11 items-center hover:text-brand">
            All ads
          </Link>
          {parentCategory && (
            <>
              <span>/</span>
              <Link href={`/${parentCategory.slug}`} className="flex min-h-11 min-w-11 items-center hover:text-brand">
                {parentCategory.name}
              </Link>
            </>
          )}
          {category && (
            <>
              <span>/</span>
              <Link href={`/${category.slug}`} className="flex min-h-11 min-w-11 items-center hover:text-brand">
                {category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate text-neutral-700">{listing.title}</span>
        </div>

        <TrackRecentlyViewed
          id={listing.id}
          href={listingPath(listing)}
          title={listing.title}
          priceLabel={currency.format(listing.price)}
          imageUrl={images[0] ?? null}
        />

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          <div className="sm:col-span-2">
            <ListingGallery images={images} title={listing.title} />

            <Card className="mt-4 gap-0 rounded-2xl border-slate-200/80 p-4 shadow-sm sm:mt-5 sm:p-5">
              {(isFeatured || isBumped) && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      Featured
                    </span>
                  )}
                  {isBumped && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      <TrendingUp className="size-3.5 text-blue-600" />
                      Bumped
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                  {listing.title}
                </h1>
                <SaveListingButton listingId={listing.id} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                <span>{listing.location}</span>
                <span className="text-neutral-300">·</span>
                <span>{formatRelativeTime(new Date(listing.created_at))}</span>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1">
                  <Eye className="size-4" />
                  {listing.views} views
                </span>
              </div>

              {headlineSpecs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-4 border-t border-neutral-100 pt-3">
                  {headlineSpecs.map((spec) => {
                    const Icon = FIELD_ICONS[spec.key] ?? Sparkles;
                    return (
                      <div key={spec.key} className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-full bg-brand-light text-brand">
                          <Icon className="size-4" />
                        </span>
                        <span className="text-base font-medium text-neutral-700">{spec.value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {(specs.length > 0 || tagSpecs.length > 0 || listing.description) && (
              <Card className="mt-4 gap-0 rounded-2xl border-slate-200/80 p-4 shadow-sm sm:mt-5 sm:p-6">
                {specs.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-lg font-bold tracking-tight text-neutral-900">Specifications</h2>
                    <div className="grid grid-cols-3 divide-y divide-neutral-200">
                      {specs.map((spec) => (
                        <div key={spec.key} className="py-2.5 pr-2">
                          <p className="text-sm font-semibold text-neutral-800 sm:text-base">{spec.value}</p>
                          <p className="text-[11px] font-medium text-neutral-400 sm:text-xs">{spec.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tagSpecs.map((spec, index) => (
                  <div
                    key={spec.key}
                    className={specs.length > 0 || index > 0 ? "mt-4 border-t border-neutral-200 pt-4" : ""}
                  >
                    <h2 className="mb-2.5 text-lg font-bold tracking-tight text-neutral-900">{spec.label}</h2>
                    <div className="flex flex-wrap gap-2">
                      {spec.values.map((value) => (
                        <span
                          key={value}
                          className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {listing.description && (
                  <div className={specs.length > 0 || tagSpecs.length > 0 ? "mt-4 border-t border-neutral-200 pt-4" : ""}>
                    <h2 className="mb-2.5 text-lg font-bold tracking-tight text-neutral-900">Description</h2>
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-600">
                      {listing.description}
                    </p>
                  </div>
                )}
              </Card>
            )}

            <Card className="mt-4 gap-0 rounded-2xl border-slate-200/80 p-4 shadow-sm sm:mt-5 sm:p-6">
              <ShareButtons title={listing.title} priceLabel={currency.format(listing.price)} />
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:col-span-1 sm:gap-4">
            {/* Tonaton-style price box: a distinct card of its own, sitting
                above the seller-info card, so the price is visible right at
                the top of the right column without needing the eye to find
                it inside the (denser, text-heavier) title card in the main
                column. */}
            <Card className="gap-0 rounded-2xl border-slate-200/80 p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight text-brand">
                  {currency.format(listing.price)}
                </p>
                {listing.is_discounted && listing.original_price != null && (
                  <>
                    <span className="text-sm font-medium text-neutral-400 line-through">
                      {currency.format(listing.original_price)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {Math.round((1 - listing.price / listing.original_price) * 100)}% OFF
                    </span>
                  </>
                )}
                {listing.negotiable === "yes" && (
                  <span className="text-sm font-medium text-neutral-500">Negotiable</span>
                )}
              </div>
            </Card>

            <Card className="gap-0 rounded-2xl border-slate-200/80 p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-3">
                <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light text-lg font-bold text-brand">
                  <AvatarContent
                    avatarUrl={sellerProfile?.avatar_url ?? listing.profiles?.avatar_url}
                    initials={sellerName[0]?.toUpperCase() ?? "F"}
                    sizes="48px"
                  />
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/u/${listing.user_id}`}
                    className="flex min-h-11 items-center gap-1 truncate text-base font-bold text-neutral-800 hover:text-brand hover:underline"
                  >
                    <span className="truncate">{sellerName}</span>
                    {(sellerProfile?.verified ?? listing.profiles?.verified) && (
                      <BadgeCheck className="size-4 shrink-0 fill-brand text-white" aria-label="Verified seller" />
                    )}
                  </Link>
                  <p className="text-sm text-neutral-500">Seller on Flikax</p>
                </div>
              </div>

              {/* Distinct from the seller-name link above, which goes to
                  /u/[id] (reputation/feedback history) -- this goes to the
                  storefront of everything else they're currently selling. */}
              <Link
                href={`/seller/${listing.user_id}`}
                className="mt-3 flex min-h-11 items-center justify-between rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:border-brand hover:text-brand"
              >
                <span className="flex items-center gap-2">
                  <Store className="size-4" />
                  Visit seller&apos;s shop
                </span>
                <ChevronRight className="size-4" />
              </Link>

              <div className="mt-4 flex flex-col gap-2">
                {sellerPhone && <RevealPhoneButton phone={sellerPhone} label="Contact Seller" />}
                <ContactSellerActions
                  listingId={listing.id}
                  sellerId={listing.user_id}
                  sellerName={sellerName}
                  hasPhone={Boolean(sellerPhone)}
                  currentPath={currentPath}
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4">
                <Button asChild variant="outline" className="h-11">
                  <a href={feedbackHref}>
                    <MessageSquareWarning className="size-4" />
                    Leave Feedback
                  </a>
                </Button>

                <span className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-base font-bold text-green-700">
                  <CheckCircle2 className="size-4" />
                  Status: {STATUS_LABELS[listing.status] ?? listing.status}
                </span>

                <ListingOwnerActions listingId={listing.id} sellerId={listing.user_id} status={listing.status} />
              </div>
            </Card>

            <Card className="gap-1 rounded-2xl border-dashed border-brand/30 bg-brand-light p-4 text-center shadow-none sm:p-5">
              <h3 className="text-sm font-bold text-neutral-800">Post an Ad Similar to This</h3>
              <p className="mt-1 text-xs text-neutral-500">Reach thousands of buyers across Ghana.</p>
              <SellCta className="mt-3 w-full" />
            </Card>

            <Card className="gap-0 rounded-2xl border-slate-200/80 p-4 shadow-sm sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-neutral-800">Safety First - Read This Before Proceeding</h3>
              <ul className="list-disc space-y-2 pl-4 marker:text-brand">
                {SAFETY_TIPS.map((tip) => (
                  <li key={tip} className="text-xs font-bold text-neutral-700">
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {similarListings.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 border-l-4 border-brand pl-3 text-xl font-bold tracking-tight text-neutral-900">
              Similar Ads
            </h2>
            <ListingGrid listings={similarListings} />
          </section>
        )}
      </main>

      <SiteFooter />
      <BottomTabBar activeHref="" />
    </div>
  );
}
