/* eslint-disable @typescript-eslint/no-explicit-any */
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
import bikroyData from '@/lib/bikroyData.json';
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

export const revalidate = 60;

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

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

type BikroySub = { slug: string; name: string; icon: string; count: number };
type BikroyCat = { subs: BikroySub[] };

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

  const carryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "page" ||!value) continue;
    carryParams.set(key, value);
  }

  const parentCategory = category.parent_id
   ? await supabase
       .from("categories")
       .select("name, slug")
       .eq("id", category.parent_id)
       .maybeSingle()
       .then((r) => r.data)
    : null;
  const topLevelSlug = category.parent_id? parentCategory?.slug : category.slug;
  const leafSlug = category.parent_id? category.slug : undefined;
  const sidebarFields = getSidebarFields(topLevelSlug, leafSlug);
  const displayFields = leafSlug? sidebarFields : getTopLevelDisplayFields(topLevelSlug);
  const quickFilterKey = getQuickFilterKey(topLevelSlug, leafSlug);
  const showAttributeQuickFilter = Boolean(leafSlug && quickFilterKey);
  const quickFilterField =
    showAttributeQuickFilter && quickFilterKey? sidebarFields.find((f) => f.key === quickFilterKey) : undefined;
  const curatedMakes = showAttributeQuickFilter && quickFilterKey === "make"? getCuratedMakes(leafSlug) : undefined;
  const fixedQuickFilterOptions =
    curatedMakes??
    (quickFilterField?.type === "checklist" && quickFilterField.options && quickFilterField.options.length > 0
     ? quickFilterField.options
      : undefined);

  const { attributeFilters, verifiedOnly, discountOnly } = parseAttributeFilters(sidebarFields, rawParams);
  const activeQuickFilterValue = quickFilterKey? rawParams[`attr_${quickFilterKey}`] : undefined;

  const subcategories = category.parent_id? [] : await getSubcategoriesWithCounts(supabase, category.id);
  const categoryIds: CategoryIdFilter =
    subcategories.length > 0? [category.id,...subcategories.map((s) => s.id)] : category.id;

  const listingsFilter = {
    categoryId: categoryIds,
    location,
    q,
    verifiedOnly,
    discountOnly,
    minPrice: minPrice? Number(minPrice) : undefined,
    maxPrice: maxPrice? Number(maxPrice) : undefined,
    sort,
    datePosted,
    attributeFilters,
  };

  const siblingsQuery = category.parent_id
   ? supabase.from("categories").select("id, name, slug, icon").eq("parent_id", category.parent_id).order("name")
    : Promise.resolve({ data: [] as { id: string; name: string; slug: string; icon: string | null }[] });

  const [{ data: siblings }, { listings, totalCount }, quickFilterValues, fieldCounts, priceBuckets] =
    await Promise.all([
      siblingsQuery,
      getCachedCategoryListings({...listingsFilter, page: 1 }),
      showAttributeQuickFilter && quickFilterKey &&!fixedQuickFilterOptions
       ? getTopAttributeValues(supabase, categoryIds, quickFilterKey)
        : Promise.resolve([]),
      getChecklistFieldCounts(supabase, categoryIds, displayFields),
      getPriceBuckets(supabase, categoryIds),
    ]);

  const resolvedDisplayFields = displayFields.map((field) => {
    if (field.type!== "checklist" || (field.options && field.options.length > 0)) return field;
    const options = Object.entries(fieldCounts[field.key]?? {})
     .sort((a, b) => b[1] - a[1])
     .slice(0, 12)
     .map(([value]) => value);
    return {...field, options };
  });

  let topBarItems: QuickFilterTileItem[] = [];
  if (!leafSlug) {
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
      const makeCounts = fieldCounts[quickFilterKey]?? {};
      const curatedSet = new Set(curatedMakes);
      const otherCount = Object.entries(makeCounts)
       .filter(([value]) =>!curatedSet.has(value))
       .reduce((sum, [, count]) => sum + count, 0);
      values = [...curatedMakes.map((value) => ({ value, count: makeCounts[value]?? 0 })), { value: "Other", count: otherCount }];
    } else if (fixedQuickFilterOptions) {
      values = fixedQuickFilterOptions.map((value) => ({ value, count: fieldCounts[quickFilterKey]?.[value]?? 0 }));
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
        href: qs? `/${category.slug}?${qs}` : `/${category.slug}`,
        icon: style === "type"? getTypeIcon(topLevelSlug, item.value, leafSlug) : null,
        monogramColor: style === "brand"? getBrandColor(item.value) : null,
        isActive,
      };
    });
  }

  const breadcrumbItems = [
    { name: "Home", item: SITE_URL },
   ...(parentCategory? [{ name: parentCategory.name, item: `${SITE_URL}/${parentCategory.slug}` }] : []),
    { name: category.name, item: `${SITE_URL}/${category.slug}` },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1,...item })),
  };

  const bikroyCat = (bikroyData as Record<string, BikroyCat>)[categorySlug];

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <JsonLd data={breadcrumbJsonLd} />
      <SiteHeader categorySearch={{ categoryName: category.name, categorySlug: category.slug, query: q }} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 hidden flex-wrap items-center gap-1 text-sm text-neutral-500 lg:flex">
          <Link href="/" className="hover:text-brand-dark">Home</Link>
          {parentCategory && (
            <>
              <span>/</span>
              <Link href={`/${parentCategory.slug}`} className="hover:text-brand-dark">{parentCategory.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-700">{category.name}</span>
        </div>

        <h1 className="mb-6 border-l-4 border-brand pl-3 text-xl font-bold text-neutral-800">
          {category.name} for Sale in Ghana
        </h1>

        {!leafSlug && bikroyCat && (
          <div className="lg:hidden -mx-4 -mt-6 mb-4 bg-white">
            <div className="flex flex-col">
              {bikroyCat.subs.map((s) => (
                <Link key={s.slug} href={`/${categorySlug}/${s.slug}`} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <div className="w- h- bg-[#f1f5f9] rounded-xl flex items-center justify-center text-">{s.icon}</div>
                  <div className="flex-1">
                    <p className="text- font-medium text-gray-900">{s.name}</p>
                    <p className="text- text-[#8fa0b3]">{s.count.toLocaleString()} ads</p>
                  </div>
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <CategoryMobileFilterPills categorySlug={category.slug} />

        <div className="flex gap-4">
          <div className="flex flex-col gap-4 lg:w- lg:shrink-0">
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
              <SiblingCategoryRow siblings={siblings?? []} activeSlug={category.slug} parentId={category.parent_id} />
            )}
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