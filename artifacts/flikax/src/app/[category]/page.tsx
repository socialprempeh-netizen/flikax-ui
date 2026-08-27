import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import {
  fetchCategoryListings,
  getTopAttributeValues,
  getSubcategoriesWithCounts,
  getChecklistFieldCounts,
  getPriceBuckets,
  parseAttributeFilters,
  type CategoryIdFilter,
  type CategorySort,
  type DatePosted,
} from "@/lib/category-listings";
import {
  getSidebarFields,
  getTopLevelDisplayFields,
  getQuickFilterKey,
  getQuickFilterStyle,
  getCuratedMakes,
  getTypeIcon,
  getBrandColor,
} from "@/lib/category-filters";
import { resolveCategoryIcon } from "@/lib/category-icons";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { JsonLd } from "@/components/seo/json-ld";
import { CategoryResults } from "@/components/category-results";
import { CategorySidebarFilters } from "@/components/category-sidebar-filters";
import { CategoryMobileFilterPills } from "@/components/category-mobile-filter-pills";
import { CategoryQuickFilters, type QuickFilterTileItem } from "@/components/category-quick-filters";
import { SiblingCategoryRow } from "@/components/sibling-category-row";
import { CategorySubcategoryListDesktop } from "@/components/category-subcategory-list";
import { loadMoreCategoryListingsAction } from "@/app/[category]/actions";
import { getSiteUrl } from "@/lib/site-url";

const VALID_SORTS: CategorySort[] = ["recommended", "newest", "price_asc", "price_desc"];
const VALID_DATE_POSTED: DatePosted[] = ["24h", "7d", "30d"];

const SITE_URL = getSiteUrl();

// Same caveat as the homepage: this route reads searchParams (q/sort/page),
// which forces it dynamic regardless of this export -- the actual "results
// no more than 60s stale, DB not re-queried every request" behavior comes
// from the unstable_cache wrapping below.
export const revalidate = 60;

type PageProps = {
  params: Promise<{ category: string }>;
  // attr_<fieldKey>/attr_<fieldKey>_min/_max are dynamic per category (see
  // category-filters.ts) so this stays a loose string map rather than
  // naming every possible key.
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

// Resolves a category at *either* level -- a leaf (e.g. "cars", parent_id
// set) or a top-level category (e.g. "vehicles", parent_id null). Both get
// the exact same listings-page treatment; see topLevelSlug/leafSlug below
// for how the sidebar/quick-filter config picks the right field set for each.
const getCategoryBySlug = unstable_cache(
  async (categorySlug: string) => {
    const supabase = createPublicClient();
    const { data: category } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("slug", categorySlug)
      .maybeSingle();
    return category;
  },
  ["category-by-slug"],
  { revalidate: 300, tags: ["categories"] }
);

// The category-page equivalent of the homepage's getHomeSearchResults --
// same reasoning: fetchCategoryListings itself takes a live Supabase client,
// which isn't something unstable_cache can use as part of a cache key, so
// this wraps it with only the plain filter values as arguments.
const getCachedCategoryListings = unstable_cache(
  async (filter: Parameters<typeof fetchCategoryListings>[1]) => {
    const supabase = createPublicClient();
    return fetchCategoryListings(supabase, filter);
  },
  ["category-listings"],
  { revalidate: 60, tags: ["listings"] }
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};

  const title = `${category.name} for Sale in Ghana | Flikax`;
  const description = `Browse ${category.name} listings across Ghana on Flikax — Ghana's classifieds marketplace.`;

  return {
    title,
    description,
    alternates: { canonical: `/${categorySlug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const supabase = createPublicClient();
  const rawParams = await searchParams;
  const { q, location, minPrice, maxPrice, sort: sortParam, posted } = rawParams;
  const sort: CategorySort = VALID_SORTS.includes(sortParam as CategorySort)
    ? (sortParam as CategorySort)
    : "recommended";
  const datePosted: DatePosted | undefined = VALID_DATE_POSTED.includes(posted as DatePosted)
    ? (posted as DatePosted)
    : undefined;

  // Moved up (was previously computed right before the JSX return) so the
  // top-bar tile hrefs below can use it -- only depends on rawParams, so there's
  // no ordering reason for it to sit any later.
  const carryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "page" || !value) continue;
    carryParams.set(key, value);
  }

  // The top-level slug (e.g. "vehicles") drives which sidebar fields and quick-filter
  // icon row this category gets. For a leaf (parent_id set) that's the parent's own
  // slug, with the leaf's own slug as the second, more specific key -- needs the
  // parent's slug, not just its id, so this one lookup runs before the rest can be
  // parallelized. For a top-level category (parent_id null, e.g. "vehicles" itself)
  // there is no parent to look up and no leaf-level override: the category's own slug
  // *is* the top-level slug, same as SIDEBAR_FIELD_KEYS/QUICK_FILTER_KEY expect.
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
  // Full field set (drives parseAttributeFilters / the quick-filter row's query
  // parsing) vs. what's actually rendered as checkboxes -- identical on a leaf page,
  // shorter on a top-level page (see getTopLevelDisplayFields).
  const sidebarFields = getSidebarFields(topLevelSlug, leafSlug);
  const displayFields = leafSlug ? sidebarFields : getTopLevelDisplayFields(topLevelSlug);
  const quickFilterKey = getQuickFilterKey(topLevelSlug, leafSlug);
  // The top bar only renders an attribute quick-filter row (Make/Type tiles) on a
  // leaf page -- a top-level page's top bar shows its own subcategories instead
  // (see topBarItems below), which used to render as a *second*, separately-styled
  // strip in the same spot on mobile (CategorySubcategoryListMobile) -- a visible
  // duplicate. One bar, one data source per page level, fixes that.
  const showAttributeQuickFilter = Boolean(leafSlug && quickFilterKey);
  // "Type"-style quick filters (vehicle_type, property_type, ...) have a fixed,
  // known option list from listing-fields.ts; "make" has none (free text) but gets
  // a curated top-N + "Other" fallback instead where one's defined (see
  // getCuratedMakes) -- either way, the tile row should always show every known/
  // curated option (real, possibly-zero count) rather than only whichever ones
  // already happen to have 2+ matching listings. See the fixedQuickFilterOptions
  // fetch-skip/merge below.
  const quickFilterField =
    showAttributeQuickFilter && quickFilterKey ? sidebarFields.find((f) => f.key === quickFilterKey) : undefined;
  const curatedMakes = showAttributeQuickFilter && quickFilterKey === "make" ? getCuratedMakes(leafSlug) : undefined;
  const fixedQuickFilterOptions =
    curatedMakes ??
    (quickFilterField?.type === "checklist" && quickFilterField.options && quickFilterField.options.length > 0
      ? quickFilterField.options
      : undefined);

  const { attributeFilters, verifiedOnly, discountOnly } = parseAttributeFilters(sidebarFields, rawParams);
  const activeQuickFilterValue = quickFilterKey ? rawParams[`attr_${quickFilterKey}`] : undefined;

  // A top-level category page (e.g. /vehicles) aggregates listings across every leaf
  // under it (Cars, Motorcycles & Scooters, ...) instead of only ones tagged to
  // "Vehicles" itself -- subcategories is only non-empty for a top-level category (see
  // below), so categoryIds is just category.id, unchanged, on a leaf page.
  const subcategories = category.parent_id ? [] : await getSubcategoriesWithCounts(supabase, category.id);
  const categoryIds: CategoryIdFilter =
    subcategories.length > 0 ? [category.id, ...subcategories.map((s) => s.id)] : category.id;

  const listingsFilter = {
    categoryId: categoryIds,
    location,
    q,
    verifiedOnly,
    discountOnly,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    datePosted,
    attributeFilters,
  };

  // Siblings (other leaves under the same parent) only matter on a leaf page --
  // superseded on a top-level page by the subcategories list above (its own children,
  // not its top-level siblings; previously this branched to fetch other top-level
  // categories via `.is("parent_id", null)` instead, kept here commented in case that
  // browsing pattern is wanted back:
  //   const siblingsQuery = supabase.from("categories").select("id, name, slug, icon").is("parent_id", null).order("name");
  const siblingsQuery = category.parent_id
    ? supabase.from("categories").select("id, name, slug, icon").eq("parent_id", category.parent_id).order("name")
    : Promise.resolve({ data: [] as { id: string; name: string; slug: string; icon: string | null }[] });

  const [{ data: siblings }, { listings, totalCount }, quickFilterValues, fieldCounts, priceBuckets] =
    await Promise.all([
      siblingsQuery,
      getCachedCategoryListings({ ...listingsFilter, page: 1 }),
      // Skipped (and merged from fieldCounts instead, below) when
      // fixedQuickFilterOptions applies, or entirely unused on a top-level page --
      // see showAttributeQuickFilter/fixedQuickFilterOptions's own comments.
      showAttributeQuickFilter && quickFilterKey && !fixedQuickFilterOptions
        ? getTopAttributeValues(supabase, categoryIds, quickFilterKey)
        : Promise.resolve([]),
      // Real per-checkbox ad counts (Make/Type/Condition/...) and the sidebar's
      // quartile price-bucket quick-picks -- see both functions' own comments in
      // category-listings.ts for why these aren't unstable_cache-wrapped like the
      // listings query above (same reasoning as quickFilterValues: live client,
      // cheap enough uncached at this traffic level).
      getChecklistFieldCounts(supabase, categoryIds, displayFields),
      getPriceBuckets(supabase, categoryIds),
    ]);

  // Make/Brand are checklist type (see DYNAMIC_CHECKLIST_FIELDS in category-filters.ts)
  // but ship with no static option list -- fieldCounts, just fetched above, already
  // has every real raw value's count for these, so it doubles as the top-N option list
  // too (sorted by count) instead of a second query. Every other checklist field
  // (Condition, Type, ...) already has its options from listing-fields.ts and passes
  // through unchanged.
  const resolvedDisplayFields = displayFields.map((field) => {
    if (field.type !== "checklist" || (field.options && field.options.length > 0)) return field;
    const options = Object.entries(fieldCounts[field.key] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([value]) => value);
    return { ...field, options };
  });

  // Unified top "sub-menus" bar data -- a top-level page shows its own
  // subcategories (Cars, Buses & Microbuses, ...) as tiles linking straight to
  // each; a leaf page shows its quick-filter attribute (Make/Type) as tiles that
  // filter *this* page. Building both into one QuickFilterTileItem[] here (rather
  // than inside CategoryQuickFilters) keeps that component a single,
  // presentational implementation instead of two different query-building code
  // paths bolted together -- see its own doc comment for the mobile duplicate
  // this replaced.
  let topBarItems: QuickFilterTileItem[] = [];
  if (!leafSlug) {
    // Subcategories always render (real, possibly-zero counts) -- getSubcategoriesWithCounts
    // already fetches every child regardless of whether it has listings yet.
    topBarItems = subcategories.map((sub) => ({
      key: sub.id,
      label: sub.name,
      count: sub.count,
      href: `/${sub.slug}`,
      icon: resolveCategoryIcon({ slug: sub.slug, icon: sub.icon }),
    }));
  } else if (showAttributeQuickFilter && quickFilterKey) {
    const style = getQuickFilterStyle(topLevelSlug, leafSlug);
    let values: { value: string; count: number }[];
    if (curatedMakes) {
      // Curated top-N makes + an "Other" catch-all summing every make not in the
      // curated list -- see getCuratedMakes's own comment.
      const makeCounts = fieldCounts[quickFilterKey] ?? {};
      const curatedSet = new Set(curatedMakes);
      const otherCount = Object.entries(makeCounts)
        .filter(([value]) => !curatedSet.has(value))
        .reduce((sum, [, count]) => sum + count, 0);
      values = [...curatedMakes.map((value) => ({ value, count: makeCounts[value] ?? 0 })), { value: "Other", count: otherCount }];
    } else if (fixedQuickFilterOptions) {
      values = fixedQuickFilterOptions.map((value) => ({ value, count: fieldCounts[quickFilterKey]?.[value] ?? 0 }));
    } else {
      values = quickFilterValues;
    }

    topBarItems = values.map((item) => {
      const isActive = activeQuickFilterValue === item.value;
      const params = new URLSearchParams(carryParams);
      params.delete("page");
      if (isActive) params.delete(`attr_${quickFilterKey}`);
      else params.set(`attr_${quickFilterKey}`, item.value);
      const qs = params.toString();
      return {
        key: item.value,
        label: item.value,
        count: item.count,
        href: qs ? `/${category.slug}?${qs}` : `/${category.slug}`,
        icon: style === "type" ? getTypeIcon(topLevelSlug, item.value, leafSlug) : null,
        monogramColor: style === "brand" ? getBrandColor(item.value) : null,
        isActive,
      };
    });
  }

  const breadcrumbItems = [
    { name: "Home", item: SITE_URL },
    ...(parentCategory ? [{ name: parentCategory.name, item: `${SITE_URL}/${parentCategory.slug}` }] : []),
    { name: category.name, item: `${SITE_URL}/${category.slug}` },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <JsonLd data={breadcrumbJsonLd} />
      <SiteHeader categorySearch={{ categoryName: category.name, categorySlug: category.slug, query: q }} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 hidden flex-wrap items-center gap-1 text-sm text-neutral-500 lg:flex">
          <Link href="/" className="hover:text-brand-dark">
            Home
          </Link>
          {parentCategory && (
            <>
              <span>/</span>
              <Link href={`/${parentCategory.slug}`} className="hover:text-brand-dark">
                {parentCategory.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-700">{category.name}</span>
        </div>

        <h1 className="mb-6 border-l-4 border-brand pl-3 text-xl font-bold text-neutral-800">
          {category.name} for Sale in Ghana
        </h1>

        <CategoryMobileFilterPills categorySlug={category.slug} />

        <div className="flex gap-4">
          <div className="flex flex-col gap-4 lg:w-[285px] lg:shrink-0">
            <CategorySubcategoryListDesktop parentId={category.id} subcategories={subcategories} />
            <CategorySidebarFilters
              categorySlug={category.slug}
              fields={resolvedDisplayFields}
              fieldCounts={fieldCounts}
              priceBuckets={priceBuckets}
            />
          </div>

          <div className="min-w-0 flex-1">
            {leafSlug && (
              <SiblingCategoryRow siblings={siblings ?? []} activeSlug={category.slug} parentId={category.parent_id} />
            )}

            {/* Single top "sub-menus" bar, single render -- see topBarItems's own
                comment for why this replaced the old top-level-only
                CategorySubcategoryListMobile (previously rendered *alongside*
                CategoryQuickFilters on a top-level page's mobile view, a visible
                duplicate). CategoryQuickFilters itself no-ops under 2 items. */}
            <CategoryQuickFilters items={topBarItems} />

            <CategoryResults
              initialListings={listings}
              initialTotalCount={totalCount}
              loadMore={loadMoreCategoryListingsAction.bind(null, listingsFilter)}
              sort={sort}
              datePosted={datePosted}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
      <BottomTabBar activeHref={`/${category.slug}`} />
    </div>
  );
}
