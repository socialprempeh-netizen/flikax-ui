import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { resolveListingImageUrl } from "@/lib/images";
import { isRecentlyBumped } from "@/lib/premium-plans";
import { getListingPath } from "@/lib/listing-url";
import { formatAttributeValue } from "@/lib/format-attribute-value";
import type { ListingCard } from "@/components/listing-grid";
import type { SidebarFilterField } from "@/lib/category-filters";

// Data layer for /[category] (and /[category]/[slug] via countCategoryListings)
// -- fetches paginated, filtered, sorted active listings for a single category,
// plus the quick-filter "top values" row and the count used for the
// noindex/sitemap decision. Counterpart to home-listings.ts, which covers the
// homepage's cross-category feed instead.
export const CATEGORY_PAGE_SIZE = 24;

/** Below this, a category+location combo is thin content — rendered (with a
 * friendly empty state) but kept out of the sitemap and marked noindex. */
export const MIN_INDEXABLE_LISTINGS = 3;

export type CategorySort = "recommended" | "newest" | "price_asc" | "price_desc";
export type DatePosted = "24h" | "7d" | "30d";

const DATE_POSTED_HOURS: Record<DatePosted, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

/** A sidebar attribute filter as actually applied to the query -- "text" carries a
 * substring `value`, "range" carries `min`/`max` (either end optional), "checklist"
 * carries the checked `values` (one or more) and whether the attribute itself stores
 * an array (`arrayField`, e.g. Key Features) rather than a single scalar. Built by the
 * caller from whichever SidebarFilterField (see category-filters.ts) the visitor
 * filled in. */
export type AttributeFilter =
  | { key: string; kind: "text"; value: string }
  | { key: string; kind: "range"; min?: number; max?: number }
  | { key: string; kind: "checklist"; values: string[]; arrayField?: boolean };

// Same pseudo-field -> query-param mapping as CategorySidebarFilters (the "Verified
// sellers"/"Discount" toggles aren't attr_<key>-namespaced -- see that component for
// why). Kept here too since this is the other half of the same URL contract.
const PSEUDO_FIELD_PARAM: Record<string, string> = {
  __verified_sellers: "verified",
  __discount: "discount",
};

/** Turns a resolved sidebar field list + the raw ?searchParams into the shape
 * fetchCategoryListings expects. Shared by both /[category] and the location-scoped
 * branch of /[category]/[slug] so the query-param format can't drift between them. */
export function parseAttributeFilters(
  fields: SidebarFilterField[],
  rawParams: Record<string, string | undefined>
): { attributeFilters: AttributeFilter[]; verifiedOnly?: boolean; discountOnly?: boolean } {
  const attributeFilters: AttributeFilter[] = [];
  let verifiedOnly: boolean | undefined;
  let discountOnly: boolean | undefined;

  for (const field of fields) {
    if (field.type === "range") {
      const min = rawParams[`attr_${field.key}_min`];
      const max = rawParams[`attr_${field.key}_max`];
      if (min || max) {
        attributeFilters.push({
          key: field.key,
          kind: "range",
          min: min ? Number(min) : undefined,
          max: max ? Number(max) : undefined,
        });
      }
    } else if (field.type === "checklist") {
      const raw = rawParams[`attr_${field.key}`];
      const values = raw ? raw.split(",").filter(Boolean) : [];
      if (values.length > 0) {
        attributeFilters.push({ key: field.key, kind: "checklist", values, arrayField: field.arrayField });
      }
    } else if (field.type === "toggle") {
      const paramName = PSEUDO_FIELD_PARAM[field.key] ?? `attr_${field.key}`;
      const raw = rawParams[paramName];
      if (raw === "yes" || raw === "no") {
        if (field.key === "__verified_sellers") verifiedOnly = raw === "yes";
        else if (field.key === "__discount") discountOnly = raw === "yes";
        // A "real" boolean attribute (Exchange Possible, Registered Car) is stored as
        // the literal string "yes"/"no" on `attributes` (see listing-form.tsx's
        // boolean checkbox handling), so an exact-match text filter is enough.
        else attributeFilters.push({ key: field.key, kind: "text", value: raw });
      }
    } else {
      const value = rawParams[`attr_${field.key}`];
      if (value) attributeFilters.push({ key: field.key, kind: "text", value });
    }
  }

  return { attributeFilters, verifiedOnly, discountOnly };
}

// A top-level category page (e.g. /vehicles) aggregates listings across every leaf
// under it (Cars, Motorcycles & Scooters, ...), not just ones tagged to "Vehicles"
// itself -- callers pass an array in that case. A leaf page keeps passing a single id,
// unchanged, and every categoryId-scoped query below branches .eq vs .in accordingly.
export type CategoryIdFilter = string | string[];

type CategoryListingsFilter = {
  categoryId: CategoryIdFilter;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: CategorySort;
  datePosted?: DatePosted;
  attributeFilters?: AttributeFilter[];
  // Backed by real listings columns (see the migration that added them), not a
  // per-category attribute -- true/false filter to that value, undefined shows all
  // (the sidebar's "Verified sellers"/"Discount" toggles are Any/Yes/No, not a plain
  // on/off switch).
  verifiedOnly?: boolean;
  discountOnly?: boolean;
  page?: number;
};

export async function fetchCategoryListings(
  supabase: SupabaseClient<Database>,
  {
    categoryId,
    location,
    minPrice,
    maxPrice,
    q,
    sort = "recommended",
    datePosted,
    attributeFilters,
    verifiedOnly,
    discountOnly,
    page = 1,
  }: CategoryListingsFilter
): Promise<{ listings: ListingCard[]; totalCount: number }> {
  let query = supabase
    .from("listings")
    .select(
      "id, title, description, price, original_price, is_discounted, seller_verified, location, is_featured, featured_until, bumped_at, short_id, listing_images(storage_path, position, width, height), categories(slug)",
      { count: "exact" }
    )
    .eq("status", "active");
  query = Array.isArray(categoryId) ? query.in("category_id", categoryId) : query.eq("category_id", categoryId);

  if (location) query = query.eq("location", location);
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);
  if (datePosted) {
    const cutoff = new Date(Date.now() - DATE_POSTED_HOURS[datePosted] * 3600 * 1000).toISOString();
    query = query.gte("created_at", cutoff);
  }
  // seller_verified/is_discounted are real columns (denormalized/generated -- see the
  // migration), not JSONB attributes, so these are plain column filters rather than
  // going through the attributeFilters loop below.
  if (verifiedOnly !== undefined) query = query.eq("seller_verified", verifiedOnly);
  if (discountOnly !== undefined) query = query.eq("is_discounted", discountOnly);

  // Range fields (year, mileage, ...) are saved as JSON *strings* on `attributes`
  // (whatever the form input sent), not JSON numbers -- so both "->>' (text) and "->"
  // (jsonb-vs-jsonb, where any string ranks above every number regardless of value)
  // silently match nothing for a numeric range. The explicit ::numeric cast on the
  // text-extracted value is what actually makes ">=" mean "greater than", not
  // "sorts later as a string" or "wrong JSON type entirely".
  for (const filter of attributeFilters ?? []) {
    if (filter.kind === "text") {
      query = query.ilike(`attributes->>${filter.key}`, `%${filter.value}%`);
    } else if (filter.kind === "range") {
      if (filter.min !== undefined) query = query.gte(`attributes->>${filter.key}::numeric`, filter.min);
      if (filter.max !== undefined) query = query.lte(`attributes->>${filter.key}::numeric`, filter.max);
    } else if (filter.arrayField) {
      // Key Features-style: attributes->key is itself a JSON array (e.g.
      // ["Air Conditioning","Sunroof"]) -- match if it contains ANY checked value,
      // via one jsonb "contains" (cs) check per value, OR'd together.
      const orExpr = filter.values
        .map((v) => `attributes->${filter.key}.cs.${JSON.stringify([v])}`)
        .join(",");
      query = query.or(orExpr);
    } else {
      // Make/Colour-style: attributes->>key is a plain scalar string -- match if
      // it's any one of the checked values.
      query = query.in(`attributes->>${filter.key}`, filter.values);
    }
  }
  // A plain ilike is enough for "narrow this category by keyword" -- unlike
  // the homepage's search_listings RPC, this isn't cross-category fuzzy
  // search, just a title filter on top of a category the user already
  // picked, so it doesn't need word_similarity ranking.
  if (q) query = query.ilike("title", `%${q}%`);

  // "Recommended" keeps the featured/bumped-first ordering; the other three
  // sorts are what a user explicitly picked, so they override it entirely
  // rather than layering underneath.
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query
      .order("is_featured", { ascending: false })
      .order("bumped_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  const from = (page - 1) * CATEGORY_PAGE_SIZE;
  const { data, count } = await query.range(from, from + CATEGORY_PAGE_SIZE - 1);

  const now = Date.now();
  const listings: ListingCard[] = (data ?? []).map((row) => {
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

  return { listings, totalCount: count ?? 0 };
}

/** The N most common values of one attribute among this category's active listings
 * (e.g. "make" for vehicles), for the quick-filter icon row. Counted in JS rather than
 * a SQL GROUP BY on a JSONB path -- categories run in the hundreds of listings, not
 * enough to matter, and it avoids a bespoke RPC just for this. */
export async function getTopAttributeValues(
  supabase: SupabaseClient<Database>,
  categoryId: CategoryIdFilter,
  attributeKey: string,
  limit = 7
): Promise<{ value: string; count: number }[]> {
  let query = supabase.from("listings").select("attributes").eq("status", "active").limit(500);
  query = Array.isArray(categoryId) ? query.in("category_id", categoryId) : query.eq("category_id", categoryId);
  const { data } = await query;

  // Grouped by the *normalized* value -- "toyota" and "Toyota", or "2026 Cadillac" and
  // "Cadillac", are the same real value with inconsistent seller-typed formatting, and
  // must merge into one count/icon rather than showing as separate near-duplicate entries.
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const value = (row.attributes as Record<string, unknown> | null)?.[attributeKey];
    if (typeof value !== "string" || !value.trim()) continue;
    const normalized = formatAttributeValue(value);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

/** Cheap head-only count, for generateMetadata's noindex decision — doesn't need row data. */
export async function countCategoryListings(
  supabase: SupabaseClient<Database>,
  categoryId: CategoryIdFilter,
  location?: string
): Promise<number> {
  let query = supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active");
  query = Array.isArray(categoryId) ? query.in("category_id", categoryId) : query.eq("category_id", categoryId);

  if (location) query = query.eq("location", location);

  const { count } = await query;
  return count ?? 0;
}

/** Just the ids of a category's direct children -- the lean version of
 * getSubcategoriesWithCounts below for call sites that only need to aggregate listings
 * (e.g. a top-level category + location page) and don't render the "Categories" list,
 * so don't need names/icons/counts or its N parallel count queries. */
export async function getChildCategoryIds(supabase: SupabaseClient<Database>, parentId: string): Promise<string[]> {
  const { data } = await supabase.from("categories").select("id").eq("parent_id", parentId);
  return (data ?? []).map((c) => c.id);
}

export type SubcategoryWithCount = { id: string; name: string; slug: string; icon: string | null; count: number };

/** A top-level category's direct children (leaves) with their real active-listing
 * count each -- the "Categories" list Tonaton shows prominently on a top-level page
 * (e.g. "Cars · 10,061 ads" under /vehicles). One head-only count query per child run
 * in parallel -- a top-level category has at most ~9 children, cheap either way. */
export async function getSubcategoriesWithCounts(
  supabase: SupabaseClient<Database>,
  parentId: string
): Promise<SubcategoryWithCount[]> {
  const { data: children } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("parent_id", parentId)
    .order("name");

  if (!children || children.length === 0) return [];

  const counts = await Promise.all(children.map((c) => countCategoryListings(supabase, c.id)));

  return children
    .map((c, i) => ({ ...c, count: counts[i] }))
    .sort((a, b) => b.count - a.count);
}
