import Link from "next/link";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";
import { ScrollableSidebarColumn } from "@/components/scrollable-sidebar-column";
import { LocationPicker } from "@/components/location-picker";
import { ExcludeLocationPicker } from "@/components/exclude-location-picker";
import { CategoryNav } from "@/components/category-nav";
import { MobileCategoryGrid } from "@/components/mobile-category-grid";
import { MobileCategoryList } from "@/components/mobile-category-list";
import { SellCta } from "@/components/cta/sell-cta";
import { CategoryThumb } from "@/components/category-thumb";

// Featured categories are pinned first in the sidebar; the rest keep their existing order.
const FEATURED_SLUGS = ["phones-tablets", "vehicles", "property"];

const PRICE_BUCKETS: { label: string; minPrice?: string; maxPrice?: string }[] = [
  { label: "Under GH₵100", maxPrice: "100" },
  { label: "GH₵100 – 500", minPrice: "100", maxPrice: "500" },
  { label: "GH₵500 – 2,000", minPrice: "500", maxPrice: "2000" },
  { label: "GH₵2,000 – 10,000", minPrice: "2000", maxPrice: "10000" },
  { label: "Over GH₵10,000", minPrice: "10000" },
];

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon?: string | null;
};

export function CategorySidebar({
  categories,
  counts,
  selectedSlug,
  filters,
}: {
  categories: Category[];
  counts: Map<string, number>;
  selectedSlug?: string;
  filters: ListingFilters;
}) {
  const parents = [...categories.filter((c) => c.parent_id === null)].sort((a, b) => {
    const aIndex = FEATURED_SLUGS.indexOf(a.slug);
    const bIndex = FEATURED_SLUGS.indexOf(b.slug);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  const selected = categories.find((c) => c.slug === selectedSlug);
  const activeParent = selected
    ? selected.parent_id
      ? categories.find((c) => c.id === selected.parent_id)
      : selected
    : undefined;

  if (!activeParent) {
    return (
      <ScrollableSidebarColumn>
        <div className="hidden lg:block">
          <CategoryNav parents={parents} categories={categories} counts={counts} filters={filters} />
        </div>
        {/* Deliberately its own paler, less-saturated shade rather than the
            shared --cream token used behind listing-card photos and the
            gallery -- this panel needed toning down without affecting those. */}
        <div className="rounded-xl bg-[#f6f3ec] p-3 lg:hidden">
          <MobileCategoryGrid parents={parents} filters={filters} />
        </div>

        <div className="hidden rounded-2xl bg-brand p-4 text-white shadow-sm lg:block">
          <h3 className="text-sm font-bold tracking-wide">Sell Something?</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-white/80">
            Post your ad free and reach thousands of buyers across Ghana.
          </p>
          <SellCta
            label="Post Ad"
            variant="footer"
            size="sm"
            className="mt-4 w-full !bg-white !text-brand hover:!bg-brand-light"
          />
        </div>
      </ScrollableSidebarColumn>
    );
  }

  const children = categories.filter((c) => c.parent_id === activeParent.id);

  return (
    <ScrollableSidebarColumn>
      <div className="hidden lg:block rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold tracking-tight text-neutral-800">Categories</h3>
        <Link
          href={buildListingsHref({ ...filters, category: undefined })}
          className="mb-1 block text-xs font-medium text-neutral-500 hover:text-brand"
        >
          All categories
        </Link>
        <p className="mb-2 truncate text-sm font-semibold text-brand">{activeParent.name}</p>
        <div className="flex flex-col divide-y divide-neutral-200">
          {children.map((child) => {
            const isActive = child.slug === selectedSlug;
            return (
              <Link
                key={child.id}
                href={`/${child.slug}`}
                className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  isActive ? "bg-brand-light font-semibold text-brand" : "text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <CategoryThumb
                  category={child}
                  size="size-7"
                  iconSize="size-3.5"
                  rounded="rounded-full"
                  sizes="28px"
                  className="ring-1 ring-slate-200/70"
                />
                <span className="min-w-0 flex-1 truncate">{child.name}</span>
                <span
                  className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-2xs font-medium ${
                    isActive ? "bg-white/60 text-brand" : "bg-slate-100 text-neutral-500"
                  }`}
                >
                  {counts.get(child.id) ?? 0}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="lg:hidden">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Link
            href={buildListingsHref({ ...filters, category: undefined })}
            className="text-xs font-medium text-neutral-500 hover:text-brand"
          >
            All categories
          </Link>
          <span className="text-xs text-neutral-300">/</span>
          <span className="truncate text-xs font-semibold text-brand">{activeParent.name}</span>
        </div>
        <MobileCategoryList categories={children} counts={counts} />
      </div>

      <div className="divide-y divide-neutral-100 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <LocationPicker filters={filters} />
        <ExcludeLocationPicker filters={filters} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold tracking-tight text-neutral-800">Price, GH₵</h3>
        <form action="/" method="get" className="mb-3 flex items-center gap-2">
          <input type="hidden" name="q" value={filters.q ?? ""} />
          <input type="hidden" name="location" value={filters.location ?? ""} />
          <input type="hidden" name="category" value={filters.category ?? ""} />
          <input
            type="number"
            name="minPrice"
            placeholder="min"
            defaultValue={filters.minPrice}
            className="w-full min-w-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          />
          <span className="shrink-0 text-neutral-400">–</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="max"
            defaultValue={filters.maxPrice}
            className="w-full min-w-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Go
          </button>
        </form>

        <div className="flex flex-col gap-0.5">
          {PRICE_BUCKETS.map((bucket) => {
            const isActive = filters.minPrice === bucket.minPrice && filters.maxPrice === bucket.maxPrice;
            return (
              <Link
                key={bucket.label}
                href={buildListingsHref({ ...filters, minPrice: bucket.minPrice, maxPrice: bucket.maxPrice })}
                className={`rounded-lg px-2 py-1 text-sm transition-colors ${
                  isActive ? "bg-brand-light font-semibold text-brand" : "text-neutral-600 hover:bg-slate-50"
                }`}
              >
                {bucket.label}
              </Link>
            );
          })}
        </div>
      </div>
    </ScrollableSidebarColumn>
  );
}
