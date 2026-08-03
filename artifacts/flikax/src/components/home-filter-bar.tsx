"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter as FilterIcon, ChevronDown } from "lucide-react";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";
import { LocationPicker } from "@/components/location-picker";
import { ExcludeLocationPicker } from "@/components/exclude-location-picker";

const PRICE_BUCKETS: { label: string; minPrice?: string; maxPrice?: string }[] = [
  { label: "Under GH₵100", maxPrice: "100" },
  { label: "GH₵100 – 500", minPrice: "100", maxPrice: "500" },
  { label: "GH₵500 – 2,000", minPrice: "500", maxPrice: "2000" },
  { label: "GH₵2,000 – 10,000", minPrice: "2000", maxPrice: "10000" },
  { label: "Over GH₵10,000", minPrice: "10000" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/** Homepage row above the listing grid: a "Fresh listings" heading plus
 * Filters (price + location, replacing what the removed sidebar used to
 * hold) and Sort. Both open as plain CSS-anchored dropdowns (absolute,
 * relative to their own trigger) on every viewport -- previously Filters
 * used a getBoundingClientRect()-measured `fixed` position on sm+ and a
 * viewport-bottom sheet below sm, and the measured coordinates could go
 * stale (rendering far from the button) whenever anything shifted between
 * the click and paint. Matching Sort's existing (correct) pattern removes
 * that whole class of bug. */
export function HomeFilterBar({ filters }: { filters: ListingFilters }) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const activeSort = SORT_OPTIONS.find((o) => o.value === (filters.sort ?? "recommended")) ?? SORT_OPTIONS[0];
  const hasActiveFilters = Boolean(filters.minPrice || filters.maxPrice || filters.location || filters.excludeLocation);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <h2 className="text-base font-bold text-neutral-800 sm:text-lg">Fresh listings</h2>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSortOpen(false);
              setFiltersOpen((v) => !v);
            }}
            className={`flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "border-brand bg-brand-light text-brand"
                : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <FilterIcon className="size-3.5" />
            Filters
            <ChevronDown className={`size-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
              <div className="absolute left-0 top-full z-50 mt-2 max-h-[80vh] w-[min(90vw,320px)] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                  <span className="text-sm font-bold text-neutral-800">Filters</span>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="text-xs font-medium text-neutral-400 hover:text-neutral-600 sm:hidden"
                  >
                    Done
                  </button>
                </div>

                <div className="divide-y divide-neutral-100">
                  <LocationPicker filters={filters} />
                  <ExcludeLocationPicker filters={filters} />

                  <div className="p-3">
                    <p className="mb-2 text-sm font-bold text-neutral-800">Price, GH₵</p>
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
                          <button
                            key={bucket.label}
                            type="button"
                            onClick={() => {
                              setFiltersOpen(false);
                              router.push(
                                buildListingsHref({ ...filters, minPrice: bucket.minPrice, maxPrice: bucket.maxPrice })
                              );
                            }}
                            className={`rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                              isActive ? "bg-brand-light font-semibold text-brand" : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                          >
                            {bucket.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setFiltersOpen(false);
              setSortOpen((v) => !v);
            }}
            className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            {activeSort.label}
            <ChevronDown className={`size-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>

          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortOpen(false);
                      router.push(buildListingsHref({ ...filters, sort: opt.value }));
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      opt.value === activeSort.value
                        ? "bg-brand-light font-semibold text-brand"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
